import redisClient from "../../db/redis.js";
import { sha256 } from "../../utils/hmac.js";
import logger from "../../utils/logger.js";

// ============================================
// Score-Based IP Reputation Service
// ============================================
// Uses Redis caching to minimize external API calls.
// Designed for Cloudflare Free + 10k daily traffic.
// FAIL-OPEN: if APIs are down, users are allowed through.

const CACHE_TTL = 3600; // 1 hour
const API_TIMEOUT = 3000; // 3 seconds

/**
 * Score-based IP reputation check.
 *
 * Score Matrix:
 *   ip-api proxy === true      → +40
 *   ip-api hosting === true    → +25
 *   proxy && hosting combined  → +15 bonus
 *   blackbox "Y" (IPv4 only)   → +30
 *   CF-IP ≠ XFF[0] mismatch   → +15
 *
 * Thresholds:
 *   >= 70  → BLOCKED
 *   40-69  → WARNING (allowed, but logged)
 *   < 40   → CLEAN
 *
 * @param {string} ip - Client IP address
 * @param {Object} headers - Request headers for mismatch detection
 * @returns {Object} { score, blocked, warning, signals }
 */
export const checkIpScore = async (ip, headers = {}) => {
    const ipHash = sha256(ip);
    const cacheKey = `ip_score:${ipHash}`;

    // 1. Check Redis cache first
    try {
        if (redisClient && redisClient.isReady) {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                logger.debug(`[IP_SCORE] Cache hit: ${ip.substring(0, 10)}... score=${parsed.score}`);
                return parsed;
            }
        }
    } catch (e) {
        // Redis down — continue without cache
        logger.warn(`[IP_SCORE] Redis cache read failed: ${e.message}`);
    }

    // 2. Calculate score from external APIs
    let score = 0;
    const signals = {};

    // 2a. ip-api.com (supports IPv4 + IPv6, free tier: 45 req/min)
    try {
        const res = await fetch(
            `http://ip-api.com/json/${ip}?fields=status,proxy,hosting,as,isp,org,timezone,countryCode`,
            { signal: AbortSignal.timeout(API_TIMEOUT) }
        );

        if (res.ok) {
            const data = await res.json();
            if (data.status === "success") {
                signals.ipApi = {
                    proxy: data.proxy,
                    hosting: data.hosting,
                    as: data.as,
                    isp: data.isp,
                    country: data.countryCode,
                    timezone: data.timezone,
                };

                if (data.proxy === true) {
                    score += 40;
                    signals.proxyFlag = true;
                }
                if (data.hosting === true) {
                    score += 25;
                    signals.hostingFlag = true;
                }
                // Bonus: both proxy AND hosting = almost certainly a VPN
                if (data.proxy === true && data.hosting === true) {
                    score += 15;
                    signals.proxyHostingCombo = true;
                }
            }
        }
    } catch (e) {
        logger.warn(`[IP_SCORE] ip-api.com failed for ${ip}: ${e.message}`);
        signals.ipApiError = true;
        // FAIL-OPEN: do not add score if API is down
    }

    // 2b. blackbox.ipinfo.app (IPv4 only — skip for IPv6 to avoid errors)
    if (!ip.includes(":")) {
        try {
            const res = await fetch(`https://blackbox.ipinfo.app/lookup/${ip}`, {
                signal: AbortSignal.timeout(API_TIMEOUT),
            });

            if (res.ok) {
                const text = (await res.text()).trim();
                if (text === "Y") {
                    score += 30;
                    signals.blackbox = true;
                }
            }
        } catch (e) {
            logger.warn(`[IP_SCORE] blackbox failed for ${ip}: ${e.message}`);
            signals.blackboxError = true;
            // FAIL-OPEN
        }
    } else {
        signals.blackboxSkipped = "IPv6";
    }

    // 2c. Header mismatch detection (CF-Connecting-IP vs X-Forwarded-For)
    const cfIp = headers["cf-connecting-ip"];
    const xffFirst = (headers["x-forwarded-for"] || "").split(",")[0].trim();
    if (cfIp && xffFirst && cfIp !== xffFirst) {
        score += 15;
        signals.headerMismatch = { cfIp, xffFirst };
    }

    // 3. Build result
    const result = {
        score,
        blocked: score >= 70,
        warning: score >= 40 && score < 70,
        signals,
        checkedAt: new Date().toISOString(),
    };

    // 4. Cache in Redis (skip on error)
    try {
        if (redisClient && redisClient.isReady) {
            await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
        }
    } catch (e) {
        logger.warn(`[IP_SCORE] Redis cache write failed: ${e.message}`);
    }

    logger.info(
        `[IP_SCORE] ${ip} → score=${score} blocked=${result.blocked} warning=${result.warning} | ${JSON.stringify(signals)}`
    );

    return result;
};
