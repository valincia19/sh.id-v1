import { ListObjectsV2Command, DeleteObjectCommand, HeadBucketCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../../config/s3.js";
import config from "../../config/index.js";
import pool from "../../db/postgres.js";
import logger from "../../utils/logger.js";

// ── Bucket name resolver ──────────────────────────────────────────────────────
const BUCKET_MAP = {
    scripts: config.s3.bucketScripts,   // v1.scripthub.id
    images: config.s3.bucketImages,     // cdn.scripthub.id
};

function resolveBucket(name) {
    const bucket = BUCKET_MAP[name];
    if (!bucket) return null;
    return bucket;
}

// ── GET /api/admin/cdn/files?bucket=scripts|images&prefix=&maxKeys=100 ────────
export const getCDNFiles = async (req, res) => {
    try {
        const bucketName = (req.query.bucket || "scripts").toLowerCase();
        const bucket = resolveBucket(bucketName);
        if (!bucket) {
            return res.status(400).json({
                error: "BadRequest",
                message: `Invalid bucket. Use one of: ${Object.keys(BUCKET_MAP).join(", ")}`,
            });
        }

        const prefix = req.query.prefix || "";
        const maxKeys = Math.min(parseInt(req.query.maxKeys) || 200, 1000);
        const continuationToken = req.query.continuationToken || undefined;
        const delimiter = req.query.delimiter || "/"; // folder-based listing by default

        const command = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            MaxKeys: maxKeys,
            ContinuationToken: continuationToken,
            Delimiter: delimiter,
        });

        const response = await s3Client.send(command);

        // Folders (CommonPrefixes) with stats
        const rawFolders = response.CommonPrefixes || [];
        const folders = await Promise.all(rawFolders.map(async (cp) => {
            const folderPrefix = cp.Prefix;
            let fileCount = 0;
            let totalSize = 0;
            try {
                // List all objects under this folder to get count + size
                let token = undefined;
                do {
                    const listCmd = new ListObjectsV2Command({
                        Bucket: bucket,
                        Prefix: folderPrefix,
                        MaxKeys: 1000,
                        ContinuationToken: token,
                    });
                    const listRes = await s3Client.send(listCmd);
                    for (const obj of (listRes.Contents || [])) {
                        fileCount++;
                        totalSize += obj.Size || 0;
                    }
                    token = listRes.IsTruncated ? listRes.NextContinuationToken : undefined;
                } while (token);
            } catch { /* non-critical */ }
            return {
                prefix: folderPrefix,
                name: folderPrefix.replace(prefix, "").replace(/\/$/, ""),
                fileCount,
                totalSize,
            };
        }));

        let files = (response.Contents || [])
            .filter(obj => obj.Key !== prefix) // exclude the prefix itself
            .map(obj => ({
                key: obj.Key,
                size: obj.Size,
                lastModified: obj.LastModified,
                eTag: obj.ETag?.replace(/"/g, ""),
                storageClass: obj.StorageClass || "STANDARD",
                owner: null,
                deploymentTitle: null,
                deploymentStatus: null,
            }));

        // ── Cross-reference with database for owner info ──────────────────
        if (files.length > 0) {
            try {
                if (bucketName === "scripts") {
                    // Scripts bucket: s3_key is stored in deployments table
                    const s3Keys = files.map(f => f.key);
                    const placeholders = s3Keys.map((_, i) => `$${i + 1}`).join(", ");
                    const dbResult = await pool.query(
                        `SELECT d.s3_key, d.title AS deployment_title, d.status AS deployment_status, d.deploy_key,
                                u.username, u.display_name
                         FROM deployments d
                         JOIN users u ON u.id = d.user_id
                         WHERE d.s3_key IN (${placeholders})`,
                        s3Keys
                    );

                    // Build a lookup map
                    const ownerMap = {};
                    for (const row of dbResult.rows) {
                        ownerMap[row.s3_key] = {
                            username: row.username,
                            displayName: row.display_name,
                            deploymentTitle: row.deployment_title,
                            deploymentStatus: row.deployment_status,
                            deployKey: row.deploy_key,
                        };
                    }

                    // Enrich files
                    files = files.map(f => {
                        const info = ownerMap[f.key];
                        if (info) {
                            f.owner = { username: info.username, displayName: info.displayName };
                            f.deploymentTitle = info.deploymentTitle;
                            f.deploymentStatus = info.deploymentStatus;
                            f.deployKey = info.deployKey;
                        }
                        return f;
                    });
                } else if (bucketName === "images") {
                    // Images bucket: try to extract user IDs from key paths
                    // Common patterns: avatars/{userId}/..., hubs/{hubId}/..., etc.
                    const userIdSet = new Set();
                    for (const f of files) {
                        const parts = f.key.split("/");
                        // Try to find UUID-like segments (8-4-4-4-12 or just 8+ hex chars)
                        for (const part of parts) {
                            if (/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(part)) {
                                userIdSet.add(part);
                            }
                        }
                    }

                    if (userIdSet.size > 0) {
                        const userIds = Array.from(userIdSet);
                        const placeholders = userIds.map((_, i) => `$${i + 1}`).join(", ");
                        const userResult = await pool.query(
                            `SELECT id, username, display_name FROM users WHERE id::text IN (${placeholders})`,
                            userIds
                        );

                        const userMap = {};
                        for (const row of userResult.rows) {
                            userMap[row.id] = { username: row.username, displayName: row.display_name };
                        }

                        files = files.map(f => {
                            const parts = f.key.split("/");
                            for (const part of parts) {
                                if (userMap[part]) {
                                    f.owner = userMap[part];
                                    break;
                                }
                            }
                            return f;
                        });
                    }
                }
            } catch (dbErr) {
                // Non-critical: if DB lookup fails, just serve files without owner info
                logger.warn("CDN owner lookup failed: %o", dbErr);
            }
        }

        res.json({
            success: true,
            data: {
                bucket: bucketName,
                bucketId: bucket,
                files,
                folders,
                total: files.length,
                isTruncated: response.IsTruncated || false,
                nextContinuationToken: response.NextContinuationToken || null,
                keyCount: response.KeyCount || 0,
            },
        });
    } catch (error) {
        logger.error("Admin getCDNFiles error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to list CDN files" });
    }
};

// ── GET /api/admin/cdn/stats ──────────────────────────────────────────────────
export const getCDNStats = async (req, res) => {
    try {
        const stats = {};

        for (const [name, bucket] of Object.entries(BUCKET_MAP)) {
            try {
                // List all objects to count them and sum sizes
                let totalSize = 0;
                let totalCount = 0;
                let continuationToken = undefined;

                do {
                    const response = await s3Client.send(new ListObjectsV2Command({
                        Bucket: bucket,
                        ContinuationToken: continuationToken,
                        MaxKeys: 1000,
                    }));

                    const contents = response.Contents || [];
                    totalCount += contents.length;
                    totalSize += contents.reduce((sum, obj) => sum + (obj.Size || 0), 0);
                    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
                } while (continuationToken);

                stats[name] = {
                    bucket,
                    totalFiles: totalCount,
                    totalSize,
                    status: "connected",
                };
            } catch (err) {
                stats[name] = {
                    bucket,
                    totalFiles: 0,
                    totalSize: 0,
                    status: "error",
                    error: err.message,
                };
            }
        }

        res.json({ success: true, data: stats });
    } catch (error) {
        logger.error("Admin getCDNStats error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch CDN stats" });
    }
};

// ── DELETE /api/admin/cdn/files ────────────────────────────────────────────────
export const deleteCDNFile = async (req, res) => {
    try {
        const bucketName = (req.query.bucket || "scripts").toLowerCase();
        const bucket = resolveBucket(bucketName);
        if (!bucket) {
            return res.status(400).json({
                error: "BadRequest",
                message: `Invalid bucket. Use one of: ${Object.keys(BUCKET_MAP).join(", ")}`,
            });
        }

        const { key } = req.body;
        if (!key || typeof key !== "string") {
            return res.status(400).json({
                error: "BadRequest",
                message: "Request body must include a 'key' string.",
            });
        }

        // Safety: prevent deleting entire bucket prefixes
        if (key.trim() === "" || key.trim() === "/") {
            return res.status(400).json({
                error: "BadRequest",
                message: "Cannot delete root or empty key.",
            });
        }

        await s3Client.send(new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        }));

        logger.info("CDN file deleted by admin | bucket=%s key=%s user=%s", bucket, key, req.user?.userId);

        res.json({
            success: true,
            message: `File '${key}' deleted from bucket '${bucket}'.`,
        });
    } catch (error) {
        logger.error("Admin deleteCDNFile error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to delete CDN file" });
    }
};

// ── GET /api/admin/cdn/preview?bucket=scripts|images&key=... ──────────────────
// Returns a short-lived signed URL for previewing any S3 object
export const getPreviewUrl = async (req, res) => {
    try {
        const bucketName = (req.query.bucket || "scripts").toLowerCase();
        const bucket = resolveBucket(bucketName);
        if (!bucket) {
            return res.status(400).json({ error: "BadRequest", message: `Invalid bucket.` });
        }

        const key = req.query.key;
        if (!key) {
            return res.status(400).json({ error: "BadRequest", message: "Missing 'key' query parameter." });
        }

        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes

        res.json({ success: true, data: { url: signedUrl, expiresIn: 300 } });
    } catch (error) {
        logger.error("Admin getPreviewUrl error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to generate preview URL" });
    }
};

// ── GET /api/admin/cdn/content?bucket=scripts|images&key=... ──────────────────
// Proxies raw text content for the code viewer (only text files)
export const getFileContent = async (req, res) => {
    try {
        const bucketName = (req.query.bucket || "scripts").toLowerCase();
        const bucket = resolveBucket(bucketName);
        if (!bucket) {
            return res.status(400).json({ error: "BadRequest", message: `Invalid bucket.` });
        }

        const key = req.query.key;
        if (!key) {
            return res.status(400).json({ error: "BadRequest", message: "Missing 'key' query parameter." });
        }

        // Only allow text-like extensions
        const ext = key.split(".").pop()?.toLowerCase();
        const textExtensions = ["txt", "lua", "json", "js", "ts", "css", "html", "xml", "md", "yaml", "yml", "toml", "ini", "cfg", "log", "csv", "sql"];
        if (!textExtensions.includes(ext || "")) {
            return res.status(400).json({ error: "BadRequest", message: "Only text files can be viewed in the editor." });
        }

        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const response = await s3Client.send(command);
        const content = await response.Body.transformToString("utf-8");

        // Cap at 500KB to prevent huge payloads
        if (content.length > 512000) {
            return res.json({
                success: true,
                data: {
                    content: content.substring(0, 512000),
                    truncated: true,
                    totalSize: content.length,
                },
            });
        }

        res.json({
            success: true,
            data: { content, truncated: false, totalSize: content.length },
        });
    } catch (error) {
        logger.error("Admin getFileContent error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch file content" });
    }
};
