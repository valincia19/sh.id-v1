import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOADERS_DIR = path.resolve(__dirname, "../deployments/loaders");

// Helper to ensure loaders directory exists
const ensureLoadersDir = async () => {
    try {
        await fs.access(LOADERS_DIR);
    } catch {
        await fs.mkdir(LOADERS_DIR, { recursive: true });
    }
};

/**
 * Get all loaders list
 * GET /api/admin/loaders
 */
export const getLoaders = async (req, res) => {
    try {
        await ensureLoadersDir();
        const files = await fs.readdir(LOADERS_DIR);

        // Only .lua files
        const loaderFiles = files.filter(f => f.endsWith(".lua"));

        const loaders = await Promise.all(
            loaderFiles.map(async (filename) => {
                const filePath = path.join(LOADERS_DIR, filename);
                const stats = await fs.stat(filePath);
                return {
                    filename,
                    size: stats.size,
                    mtime: stats.mtime,
                };
            })
        );

        res.json({ success: true, data: loaders });
    } catch (error) {
        logger.error(`[Admin][getLoaders] Error: ${error.message}`);
        res.status(500).json({ error: "ServerError", message: "Failed to read loaders directory" });
    }
};

/**
 * Get specific loader content
 * GET /api/admin/loaders/:filename
 */
export const getLoaderContent = async (req, res) => {
    try {
        const { filename } = req.params;
        if (!filename.endsWith(".lua")) {
            return res.status(400).json({ error: "InvalidRequest", message: "Invalid filename — must end with .lua" });
        }

        const safe = path.basename(filename); // prevent path traversal
        const filePath = path.join(LOADERS_DIR, safe);
        const content = await fs.readFile(filePath, "utf-8");

        res.json({ success: true, data: { filename: safe, content } });
    } catch (error) {
        logger.error(`[Admin][getLoaderContent] Error: ${error.message}`);
        res.status(404).json({ error: "NotFound", message: "Loader not found" });
    }
};

/**
 * Create or update a loader
 * PUT /api/admin/loaders/:filename
 */
export const upsertLoader = async (req, res) => {
    try {
        const { filename } = req.params;
        const { content } = req.body;

        if (!filename.endsWith(".lua")) {
            return res.status(400).json({ error: "InvalidRequest", message: "Loader filename must end with .lua" });
        }
        if (typeof content !== "string" || content.trim().length === 0) {
            return res.status(400).json({ error: "InvalidRequest", message: "Content must be a non-empty string" });
        }

        const safe = path.basename(filename);
        await ensureLoadersDir();
        const filePath = path.join(LOADERS_DIR, safe);

        // Detect if it already existed (for logging)
        let existed = false;
        try { await fs.access(filePath); existed = true; } catch { /* new file */ }

        await fs.writeFile(filePath, content, "utf-8");
        logger.info(`[Admin][upsertLoader] ${existed ? "Updated" : "Created"} loader: ${safe} by ${req.user?.userId}`);

        res.json({ success: true, message: `Loader ${safe} saved successfully` });
    } catch (error) {
        logger.error(`[Admin][upsertLoader] Error: ${error.message}`);
        res.status(500).json({ error: "ServerError", message: "Failed to save loader" });
    }
};

/**
 * Delete a loader
 * DELETE /api/admin/loaders/:filename
 */
export const deleteLoader = async (req, res) => {
    try {
        const { filename } = req.params;
        if (!filename.endsWith(".lua")) {
            return res.status(400).json({ error: "InvalidRequest", message: "Invalid filename" });
        }

        const safe = path.basename(filename);
        const filePath = path.join(LOADERS_DIR, safe);
        await fs.unlink(filePath);
        logger.info(`[Admin][deleteLoader] Deleted loader: ${safe} by ${req.user?.userId}`);

        res.json({ success: true, message: `Loader ${safe} deleted successfully` });
    } catch (error) {
        logger.error(`[Admin][deleteLoader] Error: ${error.message}`);
        if (error.code === "ENOENT") {
            return res.status(404).json({ error: "NotFound", message: "Loader not found" });
        }
        res.status(500).json({ error: "ServerError", message: "Failed to delete loader" });
    }
};
