import crypto from "crypto";
import config from "../config/index.js";

// ============================================
// HMAC-SHA256 Signing Utility
// ============================================

const SECRET = config.monetization?.secret;

/**
 * Validate the monetization secret exists.
 * Called at import time — server will fail fast if missing in production.
 */
if (!SECRET && process.env.NODE_ENV === "production") {
    console.error("❌ FATAL: MONETIZATION_SECRET is required in production");
    process.exit(1);
}

/**
 * Build the canonical message string for HMAC signing.
 * Order matters — must be identical for sign and verify.
 *
 * @param {string} sessionId
 * @param {string} ipHash
 * @param {string} uaHash
 * @param {string} provider
 * @param {string} slug
 * @returns {string}
 */
const buildMessage = (sessionId, ipHash, uaHash, provider, slug) => {
    return `${sessionId}|${ipHash}|${uaHash}|${provider}|${slug}`;
};

/**
 * Sign a monetization session.
 *
 * @param {string} sessionId - UUID of the session
 * @param {string} ipHash   - SHA-256 hash of the client IP
 * @param {string} uaHash   - SHA-256 hash of the User-Agent
 * @param {string} provider - "workink" | "linkvertise" | "official"
 * @param {string} slug     - Script slug
 * @returns {string} Hex-encoded HMAC-SHA256 signature
 */
export const signSession = (sessionId, ipHash, uaHash, provider, slug) => {
    const message = buildMessage(sessionId, ipHash, uaHash, provider, slug);
    const hmac = crypto.createHmac("sha256", SECRET || "dev-secret-do-not-use");
    hmac.update(message);
    return hmac.digest("hex");
};

/**
 * Verify a monetization session signature.
 *
 * @param {string} signature - The signature to verify
 * @param {string} sessionId - UUID of the session
 * @param {string} ipHash   - SHA-256 hash of the client IP
 * @param {string} uaHash   - SHA-256 hash of the User-Agent
 * @param {string} provider - "workink" | "linkvertise" | "official"
 * @param {string} slug     - Script slug
 * @returns {boolean}
 */
export const verifySession = (signature, sessionId, ipHash, uaHash, provider, slug) => {
    const expected = signSession(sessionId, ipHash, uaHash, provider, slug);
    // Timing-safe comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature, "hex"),
            Buffer.from(expected, "hex")
        );
    } catch {
        return false;
    }
};

/**
 * Hash a value with SHA-256 (used for IP and User-Agent).
 *
 * @param {string} value - Raw value to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
export const sha256 = (value) => {
    return crypto.createHash("sha256").update(value || "").digest("hex");
};
