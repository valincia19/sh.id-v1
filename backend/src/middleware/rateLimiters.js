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
        // Fallback to in-memory if Redis is unavailable
        return undefined;
    }
};

// ============================================
// 1. Auth Limiter — STRICT, credential endpoints only
//    Applied to: POST /login, /register
// ============================================
export const authLimiter = rateLimit({
    store: createStore("rl:auth:"),
    windowMs: config.rateLimit.auth.windowMs,     // 15 min
    max: isDev ? 100 : config.rateLimit.auth.max, // Dev: generous, Prod: strict (30)
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    skip: (req) => req.method === 'OPTIONS',
    message: {
        error: "TooManyRequests",
        statusCode: 429,
        message: "Too many authentication attempts, please try again later.",
    },
    handler: (req, res, next, options) => {
        if (req.path.includes('/discord/callback')) {
            return res.redirect(`${config.frontendUrl}/auth/callback?error=TooManyRequests`);
        }
        res.status(options.statusCode).json(options.message);
    }
});

// ============================================
// 1.5 Refresh Limiter — Protection for Token Replay
//    Applied to: POST /refresh
// ============================================
export const refreshLimiter = rateLimit({
    store: createStore("rl:refresh:"),
    windowMs: 15 * 60 * 1000,     // 15 min
    max: isDev ? 200 : 50,        // Normal users won't refresh token 50x in 15min
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    skip: (req) => req.method === 'OPTIONS',
    message: {
        error: "TooManyRequests",
        statusCode: 429,
        message: "Too many token refresh attempts, please try again later.",
    }
});

// ============================================
// 2. Write Limiter — MODERATE, mutations only
//    Applied to: POST/PUT/PATCH/DELETE (non-auth)
//    Skips: GET, HEAD, OPTIONS
// ============================================
export const writeLimiter = rateLimit({
    store: createStore("rl:write:"),
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: isDev ? 500 : 100,     // Dev: generous, Prod: moderate
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS',
    message: {
        error: "TooManyRequests",
        statusCode: 429,
        message: "Too many write requests, please try again later.",
    },
});

// ============================================
// 3. Global Limiter — VERY relaxed, absolute safety net
//    This is the outer wall — should almost never trigger
//    in normal operation. Catches abuse/scraping only.
// ============================================
export const globalLimiter = rateLimit({
    store: createStore("rl:global:"),
    windowMs: config.rateLimit.api.windowMs,       // 15 min
    max: isDev ? 10000 : config.rateLimit.api.max, // Dev: essentially unlimited, Prod: 5000
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    skip: (req) => req.method === 'OPTIONS', // Never count CORS preflights
    message: {
        error: "TooManyRequests",
        statusCode: 429,
        message: "Too many requests, please try again later.",
    },
    handler: (req, res, next, options) => {
        // Always return proper JSON, never drop connection
        try {
            if (req.path.includes('/discord/callback')) {
                return res.redirect(`${config.frontendUrl}/auth/callback?error=TooManyRequests`);
            }
            res.status(options.statusCode).json(options.message);
        } catch {
            // Last resort — ensure we never send ERR_EMPTY_RESPONSE
            if (!res.headersSent) {
                res.status(429).end('Too Many Requests');
            }
        }
    }
});


