import express from "express";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../../db/redis.js";
import logger from "../../utils/logger.js";
import * as keysController from "./keys.controller.js";

const router = express.Router();

// ============================================
// Key Validation Rate Limiter
// ============================================
const apiValidationLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: "rl:openapi:validation:",
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Maximum script executions/validations per IP per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true, // Fail-open circuit breaker
    handler: (req, res) => {
        logger.warn(`[RATE_LIMIT] API Validation hit | IP: ${req.ip}`);
        res.status(429).json({
            error: "TooManyRequests",
            message: "Too many key validations requested. Please throttle your usage.",
        });
    }
});


// Validate a license key
router.post(
    "/validate",
    apiValidationLimiter,
    keysController.validateKeyValidation,
    keysController.validateKey
);

export default router;

