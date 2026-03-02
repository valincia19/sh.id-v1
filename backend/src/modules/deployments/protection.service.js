import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../../config/s3.js";
import config from "../../config/index.js";
import logger from "../../utils/logger.js";

// ============================================
// Token / HMAC helpers
// ============================================

const SECRET = config.jwtSecret || "scripthub-protection-secret";

/**
 * Generate a one-time token for HWID verification.
 * Token = HMAC-SHA256(deployKey + hwid + timestamp)
 * Valid for `ttl` seconds (default 60).
 */
export function generateToken(deployKey, hwid, timestamp) {
    const payload = `${deployKey}:${hwid}:${timestamp}`;
    return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

/**
 * Verify a token is valid and not expired.
 */
export function verifyToken(deployKey, hwid, timestamp, token, ttlSeconds = 60) {
    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (now - parseInt(timestamp, 10) > ttlSeconds) {
        return { valid: false, reason: "Token expired" };
    }

    // Recompute and compare
    const expected = generateToken(deployKey, hwid, timestamp);
    const isValid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));

    return { valid: isValid, reason: isValid ? "OK" : "Invalid token" };
}

// ============================================
// S3 Signed URL generation
// ============================================

/**
 * Generate a short-lived presigned S3 URL for the real script content.
 * @param {string} s3Key - The S3 key of the deployment
 * @param {number} ttlSeconds - How long the URL is valid (default 30s)
 * @returns {Promise<string>} The presigned URL
 */
export async function generateSignedUrl(s3Key, ttlSeconds = 30) {
    const command = new GetObjectCommand({
        Bucket: config.s3.bucketScripts,
        Key: s3Key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: ttlSeconds });
    return url;
}

// ============================================
// Stub Generator (prepend _G globals + obfuscated code)
// ============================================

// Cache the obfuscated stub in memory (read once from disk)
let _cachedObfuscatedStub = null;

function getObfuscatedStub() {
    if (_cachedObfuscatedStub) return _cachedObfuscatedStub;

    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const stubPath = path.join(__dirname, "stub-obfuscated.lua");
        _cachedObfuscatedStub = fs.readFileSync(stubPath, "utf-8");
        logger.info("Loaded obfuscated stub from %s (%d bytes)", stubPath, _cachedObfuscatedStub.length);
    } catch (err) {
        logger.warn("Could not load obfuscated stub, falling back to plain stub: %o", err);
        _cachedObfuscatedStub = null;
    }

    return _cachedObfuscatedStub;
}

/**
 * Generate the Lua stub script that will be served to executors.
 *
 * Approach: Prepend _G global assignments with the dynamic deploy key
 * and API URL, then append the obfuscated stub code which reads from
 * these globals.
 *
 * @param {string} deployKey - The deployment key
 * @param {string} apiBaseUrl - The API base URL (e.g. https://api.scripthub.id)
 * @returns {string} Lua source code (prepend + obfuscated)
 */
export function generateStub(deployKey, apiBaseUrl) {
    const obfuscatedStub = getObfuscatedStub();

    // Prepend dynamic values as _G globals (the obfuscated code reads these)
    const prepend = `_G.__SH_API="${apiBaseUrl}";_G.__SH_KEY="${deployKey}";`;

    if (obfuscatedStub) {
        return prepend + "\n" + obfuscatedStub;
    }

    // Fallback: plain text stub (for development/testing when no obfuscated file exists)
    logger.warn("Serving PLAIN TEXT stub for %s — obfuscate stub.lua with Luraph for production!", deployKey);
    return `${prepend}
local HttpService = game:GetService("HttpService")
local RbxAnalyticsService = game:GetService("RbxAnalyticsService")
local API_BASE = _G.__SH_API
local DEPLOY_KEY = _G.__SH_KEY
_G.__SH_API = nil
_G.__SH_KEY = nil
if not API_BASE or not DEPLOY_KEY then return end
local hwid = RbxAnalyticsService:GetClientId()
local cRes = game:HttpGet(API_BASE.."/v1/challenge?key="..DEPLOY_KEY.."&hwid="..hwid)
local cData = HttpService:JSONDecode(cRes)
if not cData or not cData.token then return end
local vRes = game:HttpGet(API_BASE.."/v1/verify?key="..DEPLOY_KEY.."&hwid="..hwid.."&ts="..cData.ts.."&token="..cData.token)
local vData = HttpService:JSONDecode(vRes)
if not vData or not vData.url then return end
loadstring(game:HttpGet(vData.url))()
`;
}

