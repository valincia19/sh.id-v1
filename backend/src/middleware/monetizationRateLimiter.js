import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../db/redis.js";
import logger from "../utils/logger.js";

// ============================================
// Monetization Rate Limiters
// ============================================

/**
 * Create a Redis-backed rate limiter with fallback to memory.
 * @param {Object} options
 * @returns {import('express-rate-limit').RateLimitRequestHandler}
 */
const createLimiter = (options) => {
    const limiterConfig = {
        ...options,
        standardHeaders: true,
        legacyHeaders: false,
        passOnStoreError: true,
        handler: (req, res) => {
            logger.warn(`[RATE_LIMIT] ${options.name || "monetization"} limit hit | IP: ${req.ip}`);
            res.status(429).json({
                success: false,
                error: "TooManyRequests",
                message: options.message || "Too many requests. Please try again later.",
            });
        },
        keyGenerator: (req) => {
            // Use Cloudflare real IP if available
            return req.headers["cf-connecting-ip"]
                || req.headers["x-real-ip"]
                || req.ip
                || req.socket.remoteAddress;
        },
    };

    // Attempt to use Redis store, fall back to memory if Redis unavailable
    try {
        if (redisClient && redisClient.isReady) {
            limiterConfig.store = new RedisStore({
                sendCommand: (...args) => redisClient.sendCommand(args),
                prefix: `rl:monetization:${options.name || "default"}:`,
            });
        }
    } catch (err) {
        logger.warn(`[RATE_LIMIT] Redis unavailable for ${options.name}, using memory store`);
    }

    return rateLimit(limiterConfig);
};

/**
 * Rate limiter for session creation.
 * 20 requests per IP per 15 minutes.
 */
export const sessionStartLimiter = createLimiter({
    name: "session-start",
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: "Too many session requests. Please wait before trying again.",
});

/**
 * Rate limiter for callback validation (workink / linkvertise).
 * 10 requests per IP per 15 minutes.
 */
export const callbackLimiter = createLimiter({
    name: "callback",
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many callback attempts. Please wait before trying again.",
});

/**
 * Rate limiter for official gateway.
 * 10 requests per IP per 15 minutes.
 */
export const officialGatewayLimiter = createLimiter({
    name: "official-gateway",
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many verification attempts. Please wait before trying again.",
});
