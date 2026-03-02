import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../db/redis.js";
import config from "../config/index.js";

const isDev = config.isDevelopment;

// ============================================
// Helper: Create a Redis store with error resilience
// ============================================
const createStore = (prefix) => {
    try {
        return new RedisStore({
            sendCommand: (...args) => redisClient.sendCommand(args),
            prefix,
        });
    } catch {
        return undefined;
    }
};

// ============================================
// CDN Rate Limiter - For public script serving
// More lenient than auth, but prevents abuse
// ============================================
export const cdnLimiter = rateLimit({
    store: createStore("rl:cdn:"),
    windowMs: 60 * 1000, // 1 minute
    max: isDev ? 1000 : 120, // 120 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    keyGenerator: (req) => {
        // Use the deploy key + IP for more granular limiting
        const deployKey = req.params.deployKey || 'unknown';
        const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
        return `${ip}:${deployKey}`;
    },
    handler: (req, res) => {
        res.status(429).send(`-- Rate limited: Too many requests. Please wait before retrying.`);
    },
});

// ============================================
// Challenge/Verify Rate Limiter - Stricter
// These endpoints are more expensive (HMAC operations)
// ============================================
export const challengeLimiter = rateLimit({
    store: createStore("rl:challenge:"),
    windowMs: 60 * 1000, // 1 minute
    max: isDev ? 500 : 30, // 30 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    handler: (req, res) => {
        res.status(429).json({
            error: "TooManyRequests",
            message: "Too many challenge requests. Please wait before retrying."
        });
    },
});

// ============================================
// Key Verification Rate Limiter - For Get Key system
// Prevents brute-forcing license keys
// ============================================
export const keyVerifyLimiter = rateLimit({
    store: createStore("rl:keyverify:"),
    windowMs: 60 * 1000, // 1 minute
    max: isDev ? 200 : 10, // 10 key verifications per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    handler: (req, res) => {
        res.status(429).json({
            error: "TooManyRequests",
            message: "Too many key verification attempts. Please wait before retrying."
        });
    },
});

export default {
    cdnLimiter,
    challengeLimiter,
    keyVerifyLimiter,
};
