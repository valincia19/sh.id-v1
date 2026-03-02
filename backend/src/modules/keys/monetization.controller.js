import * as monetizationService from "./monetization.service.js";
import logger from "../../utils/logger.js";
import config from "../../config/index.js";

// ============================================
// Monetization Controller
// ============================================

/**
 * Extract the real client IP, handling Cloudflare/proxy headers.
 */
const getClientIp = (req) => {
    return req.headers["cf-connecting-ip"]
        || req.headers["x-real-ip"]
        || req.ip
        || req.socket.remoteAddress
        || "0.0.0.0";
};

/**
 * Parse session token from cookie OR X-Session-Token header.
 * Token format: "sessionId.signature"
 * Header fallback allows cross-origin usage from getfreekey subdomain.
 */
const parseSessionToken = (req) => {
    // Try cookie first, then header fallback
    const token = req.cookies?.monetization_session || req.headers["x-session-token"] || "";
    if (!token || !token.includes(".")) return { sessionId: null, signature: null };
    const dotIndex = token.indexOf(".");
    return {
        sessionId: token.substring(0, dotIndex),
        signature: token.substring(dotIndex + 1),
    };
};

/**
 * Start a monetization session.
 * POST /api/keys/public/start-session
 *
 * Body: { scriptSlug: string, network: "workink" | "linkvertise" | "official" }
 */
export const startSession = async (req, res) => {
    try {
        const { scriptSlug, network } = req.body;

        if (!scriptSlug || typeof scriptSlug !== "string") {
            return res.status(400).json({ success: false, message: "scriptSlug is required" });
        }

        const provider = network || "official";
        const validProviders = ["workink", "linkvertise", "official"];
        if (!validProviders.includes(provider)) {
            return res.status(400).json({ success: false, message: `Invalid provider. Must be one of: ${validProviders.join(", ")}` });
        }

        const clientIp = getClientIp(req);
        const userAgent = req.headers["user-agent"] || "";

        const result = await monetizationService.startSession(scriptSlug, provider, clientIp, userAgent);

        // Set session cookie (HttpOnly, SameSite=Lax for redirect-back from providers)
        res.cookie("monetization_session", `${result.sessionId}.${result.signature}`, {
            httpOnly: true,
            secure: config.isProduction,
            sameSite: "lax",
            maxAge: 60 * 60 * 1000, // 1 hour
            path: "/",
        });

        // Build session token for frontend (used via X-Session-Token header)
        const sessionToken = `${result.sessionId}.${result.signature}`;

        res.json({
            success: true,
            data: {
                sessionId: result.sessionId,
                sessionToken,
                redirectUrl: result.redirectUrl,
                provider,
                // Official gateway specific
                ...(provider === "official" ? {
                    totalCheckpoints: result.totalCheckpoints,
                    checkpointTimerSeconds: result.checkpointTimerSeconds,
                    captchaEnabled: result.captchaEnabled,
                    checkpoints: result.checkpoints || [],
                } : {}),
            },
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        if (statusCode >= 500) logger.error("Start session error: %o", error);
        res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to start session",
        });
    }
};

/**
 * Work.ink callback handler.
 * GET /api/keys/public/callback/workink?token=WORKINK_TOKEN
 *
 * Work.ink redirects the user here with their own token.
 * We validate that token via Work.ink API, then validate our HMAC session from the cookie.
 */
export const callbackWorkink = async (req, res) => {
    try {
        const workinkToken = req.query.token;
        const { sessionId, signature } = parseSessionToken(req);

        logger.info(`[MONETIZATION] callbackWorkink: cookie=${req.cookies?.monetization_session ? 'present' : 'MISSING'}, sessionId=${sessionId}, workinkToken=${workinkToken?.substring(0, 15)}`);

        if (!sessionId || !signature) {
            logger.warn(`[MONETIZATION] callbackWorkink: No session cookie found`);
            return redirectError(res, "Missing session. Please start over.");
        }

        if (!workinkToken) {
            return redirectError(res, "Missing Work.ink token.");
        }

        const clientIp = getClientIp(req);
        const userAgent = req.headers["user-agent"] || "";

        const result = await monetizationService.validateCallback(
            sessionId, signature, clientIp, userAgent, workinkToken
        );

        res.clearCookie("monetization_session", { path: "/" });

        // Redirect to frontend success page
        const frontendUrl = config.getfreekeyUrl;
        const successUrl = `${frontendUrl}/success?key=${encodeURIComponent(result.key)}&expires=${encodeURIComponent(result.expiresAt)}&slug=${encodeURIComponent(result.slug)}`;
        logger.info(`[MONETIZATION] callbackWorkink SUCCESS: redirecting to ${successUrl}`);
        res.redirect(successUrl);
    } catch (error) {
        const statusCode = error.statusCode || 500;
        logger.error(`[MONETIZATION] callbackWorkink ERROR: ${error.message} (status=${statusCode})`);
        redirectError(res, error.message);
    }
};

/**
 * Linkvertise callback handler.
 * GET /api/keys/public/callback/linkvertise
 *
 * Linkvertise redirects the user to the target URL after completion.
 * We validate our HMAC session from the cookie.
 */
export const callbackLinkvertise = async (req, res) => {
    try {
        const { sessionId, signature } = parseSessionToken(req);

        if (!sessionId || !signature) {
            return redirectError(res, "Missing session. Please start over.");
        }

        const clientIp = getClientIp(req);
        const userAgent = req.headers["user-agent"] || "";

        const result = await monetizationService.validateCallback(
            sessionId, signature, clientIp, userAgent
        );

        res.clearCookie("monetization_session", { path: "/" });

        const frontendUrl = config.getfreekeyUrl;
        res.redirect(`${frontendUrl}/success?key=${encodeURIComponent(result.key)}&expires=${encodeURIComponent(result.expiresAt)}&slug=${encodeURIComponent(result.slug)}`);
    } catch (error) {
        const statusCode = error.statusCode || 500;
        if (statusCode >= 500) logger.error("Linkvertise callback error: %o", error);
        redirectError(res, error.message);
    }
};

/**
 * Official gateway callback handler.
 * POST /api/keys/public/callback/official
 *
 * Called directly from the frontend after timer completes.
 * Uses the session cookie set during start-session.
 */
export const callbackOfficial = async (req, res) => {
    try {
        const { sessionId, signature } = parseSessionToken(req);

        if (!sessionId || !signature) {
            return res.status(400).json({ success: false, message: "Missing session. Please start over." });
        }

        const clientIp = getClientIp(req);
        const userAgent = req.headers["user-agent"] || "";

        const result = await monetizationService.validateCallback(
            sessionId, signature, clientIp, userAgent
        );

        res.clearCookie("monetization_session", { path: "/" });

        res.json({
            success: true,
            data: {
                key: result.key,
                expiresAt: result.expiresAt,
                provider: result.provider,
                slug: result.slug,
            },
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        if (statusCode >= 500) logger.error("Official callback error: %o", error);
        res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to validate session",
        });
    }
};

// ============================================
// Official Gateway Endpoints
// ============================================

/**
 * Advance to the next checkpoint.
 * POST /api/keys/public/official/advance
 */
export const officialAdvance = async (req, res) => {
    try {
        const { sessionId, signature } = parseSessionToken(req);

        if (!sessionId || !signature) {
            return res.status(400).json({ success: false, message: "Missing session. Please start over." });
        }

        const clientIp = getClientIp(req);
        const userAgent = req.headers["user-agent"] || "";

        const result = await monetizationService.advanceCheckpoint(
            sessionId, signature, clientIp, userAgent
        );

        res.json({ success: true, data: result });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        if (statusCode >= 500) logger.error("Official advance error: %o", error);
        res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to advance checkpoint",
            ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}),
        });
    }
};

/**
 * Verify captcha for official gateway.
 * POST /api/keys/public/official/verify-captcha
 */
export const officialVerifyCaptcha = async (req, res) => {
    try {
        const { sessionId, signature } = parseSessionToken(req);

        if (!sessionId || !signature) {
            return res.status(400).json({ success: false, message: "Missing session. Please start over." });
        }

        const { turnstileToken } = req.body;
        if (!turnstileToken) {
            return res.status(400).json({ success: false, message: "Captcha token is required." });
        }

        const clientIp = getClientIp(req);
        const userAgent = req.headers["user-agent"] || "";

        const result = await monetizationService.verifyCaptcha(
            sessionId, signature, clientIp, userAgent, turnstileToken
        );

        res.json({ success: true, data: result });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        if (statusCode >= 500) logger.error("Official verify-captcha error: %o", error);
        res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to verify captcha",
        });
    }
};

/**
 * Complete the official gateway flow and generate key.
 * POST /api/keys/public/official/complete
 */
export const officialComplete = async (req, res) => {
    try {
        const { sessionId, signature } = parseSessionToken(req);

        if (!sessionId || !signature) {
            return res.status(400).json({ success: false, message: "Missing session. Please start over." });
        }

        const clientIp = getClientIp(req);
        const userAgent = req.headers["user-agent"] || "";

        const result = await monetizationService.completeOfficial(
            sessionId, signature, clientIp, userAgent
        );

        // Clear session cookie after successful key generation
        res.clearCookie("monetization_session", { path: "/" });

        res.json({
            success: true,
            data: {
                key: result.key,
                expiresAt: result.expiresAt,
                provider: result.provider,
                slug: result.slug,
            },
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        if (statusCode >= 500) logger.error("Official complete error: %o", error);
        res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to complete official gateway",
        });
    }
};

/**
 * Get current official session status.
 * GET /api/keys/public/official/status
 *
 * Returns checkpoint state so the frontend can resume the flow.
 */
export const officialStatus = async (req, res) => {
    try {
        const { sessionId, signature } = parseSessionToken(req);

        if (!sessionId || !signature) {
            return res.status(400).json({ success: false, message: "No active session" });
        }

        const clientIp = getClientIp(req);
        const userAgent = req.headers["user-agent"] || "";

        // We call the service to load + validate the session
        const result = await monetizationService.getOfficialStatus(
            sessionId, signature, clientIp, userAgent
        );

        res.json({ success: true, data: result });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        if (statusCode >= 500) logger.error("Official status error: %o", error);
        res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to get session status",
        });
    }
};

/**
 * Helper: redirect to frontend error page.
 */
const redirectError = (res, message) => {
    const frontendUrl = config.getfreekeyUrl;
    res.redirect(`${frontendUrl}/error?message=${encodeURIComponent(message)}`);
};


