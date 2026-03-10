import * as monetizationService from "./monetization.service.js";
import { checkIpScore } from "./ipScore.service.js";
import { sha256 } from "../../utils/hmac.js";
import logger from "../../utils/logger.js";
import config from "../../config/index.js";

// ============================================
// Monetization Controller
// ============================================

/**
 * Extract the real client IP from the Cloudflare → Nginx → Express chain.
 *
 * Priority:
 * 1. CF-Connecting-IP (set by Cloudflare, cannot be spoofed by end users)
 * 2. X-Real-IP (set by our Nginx config)
 * 3. X-Forwarded-For first entry (standard proxy header)
 * 4. req.ip (Express parsed, depends on trust proxy setting)
 *
 * IPv6 handling: Strip ::ffff: prefix for mapped IPv4 addresses
 */
const getClientIp = (req) => {
    let ip = req.headers["cf-connecting-ip"]
        || req.headers["x-real-ip"]
        || (req.headers["x-forwarded-for"] || "").split(",")[0].trim()
        || req.ip
        || req.socket.remoteAddress
        || "0.0.0.0";

    // Normalize IPv4-mapped IPv6 addresses (::ffff:1.2.3.4 → 1.2.3.4)
    if (ip.startsWith("::ffff:")) ip = ip.substring(7);

    return ip;
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

        // Score-based IP reputation check (Redis-cached, fail-open)
        const ipCheck = await checkIpScore(clientIp, req.headers);
        if (ipCheck.blocked) {
            logger.warn(`[MONETIZATION] IP blocked: ${clientIp} score=${ipCheck.score}`);
            return res.status(403).json({
                success: false,
                message: "Access denied. VPN, proxy, or suspicious connection detected.",
                code: "IP_BLOCKED",
            });
        }

        const result = await monetizationService.startSession(scriptSlug, provider, clientIp, userAgent);

        // Set session cookie — domain=.scripthub.id for cross-subdomain access
        // sameSite=none + secure for cross-origin cookie sending from getfreekey subdomain
        res.cookie("monetization_session", `${result.sessionId}.${result.signature}`, {
            httpOnly: true,
            secure: config.isProduction,
            sameSite: config.isProduction ? "none" : "lax",
            domain: config.isProduction ? ".scripthub.id" : undefined,
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
        let { sessionId, signature } = parseSessionToken(req);

        // Fallback: If cookie is missing due to browser privacy policies, find active session by IP
        if (!sessionId || !signature) {
            const clientIp = getClientIp(req);
            const ipHash = sha256(clientIp);
            const fallback = await monetizationService.getLatestSessionByIp(ipHash, "workink");
            if (fallback.sessionId && fallback.signature) {
                sessionId = fallback.sessionId;
                signature = fallback.signature;
                logger.info(`[MONETIZATION] IP Fallback used for Work.ink: session=${sessionId}`);
            }
        }

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

        res.clearCookie("monetization_session", { path: "/", domain: config.isProduction ? ".scripthub.id" : undefined });

        // Redirect to frontend success page
        const frontendUrl = config.getkeyUrl;
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
 * Detect if the request is from a bot/crawler (Discord, Telegram, Twitter, Facebook, etc.)
 * so we can serve OG-rich HTML instead of a redirect.
 */
const isBotCrawler = (userAgent) => {
    const bots = [
        "Discordbot", "TelegramBot", "Twitterbot", "facebookexternalhit",
        "LinkedInBot", "Slackbot", "WhatsApp", "Googlebot", "bingbot",
        "Embedly", "Iframely", "MetaInspector", "Applebot"
    ];
    return bots.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));
};

/**
 * Serve a branded Open Graph HTML page for bot crawlers.
 */
const serveOgPage = (res) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ScriptHub – Get Your Free Key</title>
    <meta name="description" content="Complete the verification to receive your free script license key from ScriptHub.">
    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="ScriptHub">
    <meta property="og:title" content="ScriptHub – Get Your Free Key">
    <meta property="og:description" content="Complete the verification to get your free license key. Powered by ScriptHub – the trusted script distribution platform.">
    <meta property="og:url" content="https://api.scripthub.id/api/keys/public/callback/linkvertise">
    <meta property="og:image" content="https://scripthub.id/og-default.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="ScriptHub – Get Your Free Key">
    <meta name="twitter:description" content="Complete the verification to get your free license key. Powered by ScriptHub.">
    <meta name="twitter:image" content="https://scripthub.id/og-default.png">
    <!-- Theme -->
    <meta name="theme-color" content="#10b981">
</head>
<body style="background:#09090b;color:#fafafa;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
    <div style="text-align:center;max-width:420px;padding:2rem">
        <h1 style="font-size:1.5rem;margin-bottom:.5rem">ScriptHub</h1>
        <p style="color:#a1a1aa;font-size:.875rem">Complete the verification to receive your free license key.</p>
    </div>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
};

/**
 * Linkvertise callback handler.
 * GET /api/keys/public/callback/linkvertise
 *
 * Linkvertise redirects the user to the target URL after completion.
 * We validate our HMAC session from the cookie.
 * Bot crawlers receive an OG-enriched HTML page instead.
 */
export const callbackLinkvertise = async (req, res) => {
    try {
        // Serve OG page for bot crawlers
        const userAgent = req.headers["user-agent"] || "";
        if (isBotCrawler(userAgent)) {
            return serveOgPage(res);
        }

        let { sessionId, signature } = parseSessionToken(req);

        // Fallback: If cookie is missing due to browser privacy policies, find active session by IP
        if (!sessionId || !signature) {
            const clientIp = getClientIp(req);
            const ipHash = sha256(clientIp);
            const fallback = await monetizationService.getLatestSessionByIp(ipHash, "linkvertise");
            if (fallback.sessionId && fallback.signature) {
                sessionId = fallback.sessionId;
                signature = fallback.signature;
                logger.info(`[MONETIZATION] IP Fallback used for Linkvertise: session=${sessionId}`);
            }
        }

        if (!sessionId || !signature) {
            return redirectError(res, "Missing session. Please start over.");
        }

        const clientIp = getClientIp(req);

        const result = await monetizationService.validateCallback(
            sessionId, signature, clientIp, userAgent
        );

        res.clearCookie("monetization_session", { path: "/", domain: config.isProduction ? ".scripthub.id" : undefined });

        const frontendUrl = config.getkeyUrl;
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

        res.clearCookie("monetization_session", { path: "/", domain: config.isProduction ? ".scripthub.id" : undefined });

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
        res.clearCookie("monetization_session", { path: "/", domain: config.isProduction ? ".scripthub.id" : undefined });

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
    const frontendUrl = config.getkeyUrl;
    res.redirect(`${frontendUrl}/error?message=${encodeURIComponent(message)}`);
};


