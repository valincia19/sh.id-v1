import pool from "../../db/postgres.js";
import { signSession, verifySession, sha256 } from "../../utils/hmac.js";
import * as keysService from "./keys.service.js";
import * as plansService from "../plans/plans.service.js";
import config from "../../config/index.js";
import logger from "../../utils/logger.js";
import crypto from "crypto";

// ============================================
// Monetization Session Service
// ============================================

/**
 * Check if the script owner has exceeded their plan's key quota.
 * Uses the existing verifyKeyQuota from plans.service which checks user_maximums.
 * Throws a descriptive error if limit reached.
 *
 * @param {string} ownerId - Script owner's user ID
 */
const checkOwnerKeyQuota = async (ownerId) => {
    try {
        await plansService.verifyKeyQuota(ownerId, 1);
    } catch (err) {
        // Re-throw with a user-friendly message for GetFreeKey users
        const maximums = await plansService.getUserMaximums(ownerId);
        const maxKeys = maximums.maximum_keys;
        logger.warn(`[MONETIZATION] Owner ${ownerId} hit key limit: ${maxKeys} max (${err.message})`);
        const error = new Error(`Key limit reached. This creator has reached their maximum of ${maxKeys} keys. Contact the script creator to upgrade their plan.`);
        error.statusCode = 403;
        error.code = "KEY_LIMIT_REACHED";
        throw error;
    }
};

/**
 * Load a script's key_settings (monetization config).
 * Returns null if script doesn't exist or getkey is disabled.
 *
 * @param {string} slug
 * @returns {Object|null}
 */
export const getScriptSettings = async (slug) => {
    const result = await pool.query(
        `SELECT
        s.id AS script_id, s.slug, s.owner_id, s.title,
        ks.getkey_enabled,
        ks.workink_enabled, ks.linkvertise_enabled, ks.official_enabled,
        ks.ad_links,
        ks.checkpoint_timer_seconds, ks.cooldown_hours,
        ks.key_duration_hours, ks.max_keys_per_ip,
        ks.captcha_enabled
     FROM scripts s
     JOIN key_settings ks ON ks.user_id = s.owner_id
     WHERE s.slug = $1 AND s.deleted_at IS NULL AND s.status = 'published'`,
        [slug]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0];
};

/**
 * Fallback mechanism: Find the latest unused session for an IP and provider.
 * Used when strict browser cookie policies block the monetization session cookie.
 */
export const getLatestSessionByIp = async (ipHash, provider) => {
    const result = await pool.query(
        `SELECT id, signature FROM monetization_sessions 
         WHERE ip_hash = $1 AND provider = $2 AND used = false 
         ORDER BY created_at DESC LIMIT 1`,
        [ipHash, provider]
    );

    if (result.rows.length === 0) {
        return { sessionId: null, signature: null };
    }

    return {
        sessionId: result.rows[0].id,
        signature: result.rows[0].signature
    };
};

/**
 * Start a new monetization session.
 *
 * @param {string} slug     - Script slug
 * @param {string} provider - "workink" | "linkvertise" | "official"
 * @param {string} clientIp - Raw client IP
 * @param {string} userAgent - Raw User-Agent string
 * @returns {Object} { sessionId, signature, redirectUrl }
 */
export const startSession = async (slug, provider, clientIp, userAgent) => {
    const ipHash = sha256(clientIp);
    const uaHash = sha256(userAgent);

    // 1. Load script + settings
    const settings = await getScriptSettings(slug);
    if (!settings) {
        throw Object.assign(new Error("Script not found or key system not configured"), { statusCode: 404 });
    }

    if (!settings.getkey_enabled) {
        throw Object.assign(new Error("Key system is not enabled for this script"), { statusCode: 403 });
    }

    // 2. Check provider is available at platform level
    // Work.ink/Linkvertise availability is determined by whether ScriptHub has configured the URL
    const providerAvailable = {
        workink: !!config.monetization.workinkUrl,
        linkvertise: !!config.monetization.linkvertiseUrl,
        official: true, // Always available
    };

    if (!providerAvailable[provider]) {
        throw Object.assign(new Error(`Provider "${provider}" is not available`), { statusCode: 400 });
    }

    // 3. Anti-parallel: one active session per IP + slug
    const activeSession = await pool.query(
        `SELECT id FROM monetization_sessions
     WHERE ip_hash = $1 AND script_slug = $2 AND used = false
       AND created_at > NOW() - INTERVAL '1 hour'
     LIMIT 1`,
        [ipHash, slug]
    );

    if (activeSession.rows.length > 0) {
        // Replace old session — user is restarting the flow
        // Anti-bypass is still intact: they must complete the full flow each time
        const oldIds = activeSession.rows.map(r => r.id);
        await pool.query(
            `DELETE FROM used_captcha_tokens WHERE session_id = ANY($1)`,
            [oldIds]
        );
        await pool.query(
            `DELETE FROM monetization_sessions WHERE ip_hash = $1 AND script_slug = $2 AND used = false`,
            [ipHash, slug]
        );
        logger.info(`[MONETIZATION] Replaced stale session(s) for ip=${ipHash.substring(0, 8)}... slug=${slug}`);
    }

    // 4. No cooldown/daily limit — users can generate as many keys as they want
    //    as long as they complete the full flow each time (anti-bypass stays intact)

    // 5. Build checkpoints for official provider
    let checkpointsJson = [];
    let totalCheckpoints = 0;

    if (provider === "official") {
        // Build checkpoint list from user ad_links + mandatory platform link
        const userAdLinks = Array.isArray(settings.ad_links) ? settings.ad_links : [];
        const platformAdLink = config.monetization.platformAdLink;

        // Mandatory platform link always first (if configured)
        if (platformAdLink && platformAdLink !== "") {
            checkpointsJson.push({ type: "ad", url: platformAdLink, label: "Sponsored Link" });
        }

        // Add user ad links
        for (const link of userAdLinks) {
            if (typeof link === "string" && link.trim()) {
                checkpointsJson.push({ type: "ad", url: link.trim(), label: "Checkpoint" });
            } else if (typeof link === "object" && link?.url) {
                checkpointsJson.push({ type: "ad", url: link.url, label: link.label || "Checkpoint" });
            }
        }

        totalCheckpoints = checkpointsJson.length;
        logger.info(`[MONETIZATION] Official: ${totalCheckpoints} checkpoint(s) built for slug=${slug}`);
    }

    // 6. Create session
    const sessionId = crypto.randomUUID();
    const signature = signSession(sessionId, ipHash, uaHash, provider, slug);

    await pool.query(
        `INSERT INTO monetization_sessions (id, script_slug, provider, ip_hash, ua_hash, signature, checkpoint_index, total_checkpoints, checkpoints_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [sessionId, slug, provider, ipHash, uaHash, signature, 0, totalCheckpoints, JSON.stringify(checkpointsJson)]
    );

    // 7. Build redirect URL
    const redirectUrl = buildRedirectUrl(provider, sessionId, signature);

    logger.info(`[MONETIZATION] Session created: ${sessionId} | slug=${slug} | provider=${provider}`);

    return {
        sessionId,
        signature,
        redirectUrl,
        // Official-specific data for frontend
        ...(provider === "official" ? {
            totalCheckpoints,
            checkpointTimerSeconds: settings.checkpoint_timer_seconds || 10,
            captchaEnabled: settings.captcha_enabled !== false,
            checkpoints: checkpointsJson,
        } : {}),
    };
};

/**
 * Build redirect URL for a given provider.
 *
 * Work.ink: We set our callback URL as the destination.
 *   Work.ink adds {TOKEN} to the URL which we validate server-side.
 *   The MONETIZATION_WORKINK_URL is the Work.ink link URL, and our callback
 *   is appended as destination so Work.ink redirects user there with their token.
 *
 * Linkvertise: The target URL of the Linkvertise post points to our callback.
 *   After user completes ad tasks, Linkvertise redirects to target URL.
 *
 * Official: No external redirect — handled entirely by frontend.
 */
const buildRedirectUrl = (provider, sessionId, signature) => {
    const callbackBase = `${config.apiUrl}/api/keys/public/callback`;
    const ourToken = `${sessionId}.${signature}`;

    // No local sandbox bypass. Must use real providers.

    switch (provider) {
        case "workink": {
            // Work.ink link URL — user goes here to start the process
            // Our callback URL is embedded so Work.ink redirects back with their token
            const workinkUrl = config.monetization.workinkUrl;
            if (!workinkUrl) return null;
            return workinkUrl;
        }
        case "linkvertise": {
            // Linkvertise link URL — user goes here, then gets redirected to target
            const linkvertiseUrl = config.monetization.linkvertiseUrl;
            if (!linkvertiseUrl) return null;
            return linkvertiseUrl;
        }
        case "official": {
            return null;
        }
        default:
            return null;
    }
};

/**
 * Validate a Work.ink token by calling their API.
 * https://work.ink/_api/v2/token/isValid/<Token>?deleteToken=1
 *
 * @param {string} workinkToken - Token provided by Work.ink in the redirect
 * @returns {Object} { valid: boolean, ... }
 */
export const validateWorkinkToken = async (workinkToken) => {
    try {
        const response = await fetch(
            `https://work.ink/_api/v2/token/isValid/${encodeURIComponent(workinkToken)}?deleteToken=1`
        );
        const data = await response.json();
        logger.info(`[MONETIZATION] Work.ink validation: token=${workinkToken.substring(0, 8)}... valid=${data.valid}`);
        return data;
    } catch (error) {
        logger.error(`[MONETIZATION] Work.ink API error: ${error.message}`);
        throw Object.assign(new Error("Failed to verify Work.ink completion"), { statusCode: 502 });
    }
};

/**
 * Validate and complete a monetization callback.
 *
 * @param {string} sessionId  - Our session UUID (from cookie)
 * @param {string} signature  - Our HMAC signature (from cookie)
 * @param {string} clientIp   - Raw client IP
 * @param {string} userAgent  - Raw User-Agent string
 * @param {string|null} providerToken - External provider token (e.g., Work.ink token)
 * @returns {Object} { key, expiresAt, provider }
 */
export const validateCallback = async (sessionId, signature, clientIp, userAgent, providerToken = null) => {
    if (!sessionId || !signature) {
        throw Object.assign(new Error("Missing session credentials"), { statusCode: 400 });
    }

    // 1. Fetch session
    const result = await pool.query(
        `SELECT ms.*, s.id AS script_id, s.owner_id,
            ks.checkpoint_timer_seconds, ks.key_duration_hours
     FROM monetization_sessions ms
     JOIN scripts s ON s.slug = ms.script_slug AND s.deleted_at IS NULL
     JOIN key_settings ks ON ks.user_id = s.owner_id
     WHERE ms.id = $1`,
        [sessionId]
    );

    if (result.rows.length === 0) {
        throw Object.assign(new Error("Session not found"), { statusCode: 404 });
    }

    const session = result.rows[0];

    // 2. Anti-replay
    if (session.used) {
        throw Object.assign(new Error("Session already used"), { statusCode: 409 });
    }

    // 3. Verify HMAC signature (proves session wasn't tampered)
    const currentIpHash = sha256(clientIp);

    // Verify using the original hashes stored in the DB, not the current ones
    // This allows us to validate the cookie itself hasn't been tampered with.
    const isValid = verifySession(
        signature, sessionId, session.ip_hash, session.ua_hash, session.provider, session.script_slug
    );

    if (!isValid) {
        logger.warn(`[MONETIZATION] HMAC mismatch for session ${sessionId}`);
        throw Object.assign(new Error("Invalid or tampered session"), { statusCode: 403 });
    }

    // 4. IP binding Check (Relaxed for mobile users)
    // We only log if it changed, we do not throw an error because mobile IPs and UAs change frequently
    // between clicking the link and returning from the ad provider.
    if (session.ip_hash !== currentIpHash) {
        logger.warn(`[MONETIZATION] IP mismatch for session ${sessionId} (Mobile IP rotation likely, allowing)`);
    }

    // 5. Anti-speedrun: minimum time elapsed (skip in development/sandbox mode)
    if (!config.isDevelopment) {
        const minDelaySeconds = session.checkpoint_timer_seconds || 10;
        const elapsed = (Date.now() - new Date(session.created_at).getTime()) / 1000;

        if (elapsed < minDelaySeconds) {
            logger.warn(`[MONETIZATION] Too fast: ${elapsed}s < ${minDelaySeconds}s for session ${sessionId}`);
            throw Object.assign(new Error("Completed too quickly — suspected bypass"), { statusCode: 403 });
        }
    }

    // 6. Provider-specific validation
    if (session.provider === "workink" && providerToken) {
        const workinkResult = await validateWorkinkToken(providerToken);
        if (!workinkResult.valid) {
            throw Object.assign(new Error("Work.ink token is invalid or already used"), { statusCode: 403 });
        }
    }

    // 7. Atomic mark-as-used
    const updateResult = await pool.query(
        `UPDATE monetization_sessions
     SET used = true, completed_at = NOW()
     WHERE id = $1 AND used = false
     RETURNING id`,
        [sessionId]
    );

    if (updateResult.rowCount === 0) {
        throw Object.assign(new Error("Session already consumed"), { statusCode: 409 });
    }

    // 8. Check plan key quota before generating
    await checkOwnerKeyQuota(session.owner_id);

    // 9. Generate license key
    const keyDurationHours = session.key_duration_hours || 6;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + keyDurationHours);

    const keys = await keysService.generateKeys({
        scriptId: session.script_id,
        ownerId: session.owner_id,
        type: "timed",
        maxDevices: 1,
        expiresAt,
        note: `GetFreeKey | ${session.provider} | IP: ${ipHash.substring(0, 8)}...`,
        quantity: 1,
    });

    const generatedKey = keys[0];

    logger.info(`[MONETIZATION] Key generated: ${generatedKey.key_value} | session=${sessionId} | provider=${session.provider}`);

    return {
        key: generatedKey.key_value,
        expiresAt: new Date(generatedKey.expires_at).toISOString(),
        provider: session.provider,
        slug: session.script_slug,
    };
};

// ============================================
// Official Gateway — Checkpoint Progression
// ============================================

/**
 * Load and validate an official session from cookie credentials.
 * Shared helper for all official gateway endpoints.
 *
 * @param {string} sessionId
 * @param {string} signature
 * @param {string} clientIp
 * @param {string} userAgent
 * @returns {Object} session row
 */
const loadOfficialSession = async (sessionId, signature, clientIp, userAgent) => {
    if (!sessionId || !signature) {
        throw Object.assign(new Error("Missing session credentials"), { statusCode: 400 });
    }

    const result = await pool.query(
        `SELECT ms.*, s.id AS script_id, s.owner_id,
            ks.checkpoint_timer_seconds, ks.key_duration_hours, ks.captcha_enabled
     FROM monetization_sessions ms
     JOIN scripts s ON s.slug = ms.script_slug AND s.deleted_at IS NULL
     JOIN key_settings ks ON ks.user_id = s.owner_id
     WHERE ms.id = $1 AND ms.provider = 'official'`,
        [sessionId]
    );

    if (result.rows.length === 0) {
        throw Object.assign(new Error("Official session not found"), { statusCode: 404 });
    }

    const session = result.rows[0];

    // Anti-replay
    if (session.used) {
        throw Object.assign(new Error("Session already used"), { statusCode: 409 });
    }

    // Verify HMAC signature
    const ipHash = sha256(clientIp);
    const uaHash = sha256(userAgent);

    const isValid = verifySession(
        signature, sessionId, ipHash, uaHash, session.provider, session.script_slug
    );

    if (!isValid) {
        logger.warn(`[OFFICIAL] HMAC mismatch for session ${sessionId}`);
        throw Object.assign(new Error("Invalid or tampered session"), { statusCode: 403 });
    }

    // IP binding
    if (session.ip_hash !== ipHash) {
        logger.warn(`[OFFICIAL] IP mismatch for session ${sessionId}`);
        throw Object.assign(new Error("Session bound to different device"), { statusCode: 403 });
    }

    return session;
};

/**
 * Advance to the next checkpoint in the Official Gateway.
 *
 * Server-side enforcement:
 * - Validates that enough time has passed since last checkpoint (timer enforcement)
 * - Increments checkpoint_index
 * - Returns the next checkpoint info (ad URL, etc.)
 *
 * @param {string} sessionId
 * @param {string} signature
 * @param {string} clientIp
 * @param {string} userAgent
 * @returns {Object} { currentIndex, totalCheckpoints, nextCheckpoint, completed }
 */
export const advanceCheckpoint = async (sessionId, signature, clientIp, userAgent) => {
    const session = await loadOfficialSession(sessionId, signature, clientIp, userAgent);

    const checkpoints = session.checkpoints_json || [];
    const currentIndex = session.checkpoint_index || 0;
    const totalCheckpoints = session.total_checkpoints || 0;

    // Already completed all checkpoints
    if (currentIndex >= totalCheckpoints) {
        return {
            currentIndex: totalCheckpoints,
            totalCheckpoints,
            nextCheckpoint: null,
            completed: true,
        };
    }

    // Anti-speedrun: enforce minimum timer per checkpoint (skip in dev with sandbox)
    const timerSeconds = session.checkpoint_timer_seconds || 10;
    const referenceTime = session.last_checkpoint_at || session.created_at;
    const elapsedMs = Date.now() - new Date(referenceTime).getTime();
    const elapsedSeconds = elapsedMs / 1000;

    if (!config.isDevelopment && elapsedSeconds < timerSeconds) {
        const remaining = Math.ceil(timerSeconds - elapsedSeconds);
        logger.warn(`[OFFICIAL] Too fast: ${elapsedSeconds.toFixed(1)}s < ${timerSeconds}s for session ${sessionId}`);
        throw Object.assign(
            new Error(`Please wait ${remaining} more second(s) before proceeding.`),
            { statusCode: 429, retryAfter: remaining }
        );
    }

    // Advance to next checkpoint
    const newIndex = currentIndex + 1;
    await pool.query(
        `UPDATE monetization_sessions
     SET checkpoint_index = $1, last_checkpoint_at = NOW()
     WHERE id = $2`,
        [newIndex, sessionId]
    );

    logger.info(`[OFFICIAL] Checkpoint ${currentIndex} → ${newIndex} / ${totalCheckpoints} | session=${sessionId}`);

    // Return next checkpoint info (or null if all done)
    const nextCheckpoint = newIndex < totalCheckpoints ? checkpoints[newIndex] : null;

    return {
        currentIndex: newIndex,
        totalCheckpoints,
        nextCheckpoint,
        completed: newIndex >= totalCheckpoints,
    };
};

/**
 * Verify Turnstile captcha for Official Gateway session.
 *
 * @param {string} sessionId
 * @param {string} signature
 * @param {string} clientIp
 * @param {string} userAgent
 * @param {string} turnstileToken - Cloudflare Turnstile response token
 * @returns {Object} { verified: true }
 */
export const verifyCaptcha = async (sessionId, signature, clientIp, userAgent, turnstileToken) => {
    const session = await loadOfficialSession(sessionId, signature, clientIp, userAgent);

    // Validate all checkpoints are done first
    if (session.checkpoint_index < session.total_checkpoints) {
        throw Object.assign(new Error("Complete all checkpoints before captcha verification"), { statusCode: 403 });
    }

    // Already verified
    if (session.captcha_verified) {
        return { verified: true };
    }

    if (!turnstileToken) {
        throw Object.assign(new Error("Captcha token is required"), { statusCode: 400 });
    }

    // Anti-replay: check if this token was already used (production only)
    // In dev mode, Turnstile test widget always returns the same token
    const tokenHash = sha256(turnstileToken);

    if (!config.isDevelopment) {
        const existingToken = await pool.query(
            `SELECT token_hash FROM used_captcha_tokens WHERE token_hash = $1`,
            [tokenHash]
        );

        if (existingToken.rows.length > 0) {
            logger.warn(`[OFFICIAL] Captcha token replay attempt: ${tokenHash.substring(0, 16)}...`);
            throw Object.assign(new Error("Captcha token already used"), { statusCode: 403 });
        }
    }

    // Verify with Cloudflare Turnstile API
    const turnstileSecret = config.monetization.turnstileSecret;

    if (!turnstileSecret && config.isProduction) {
        logger.error("[OFFICIAL] FATAL: TURNSTILE_SECRET_KEY not configured");
        throw Object.assign(new Error("Captcha service unavailable"), { statusCode: 500 });
    }

    // In development mode, skip Turnstile verification
    // (test site keys produce tokens that are invalid with real secrets)
    if (config.isDevelopment) {
        logger.info(`[OFFICIAL] Dev mode: skipping Turnstile verification`);
    } else {
        const verifyResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                secret: turnstileSecret,
                response: turnstileToken,
                remoteip: clientIp,
            }),
        });

        const verifyData = await verifyResponse.json();

        if (!verifyData.success) {
            logger.warn(`[OFFICIAL] Turnstile verification failed: ${JSON.stringify(verifyData)}`);
            throw Object.assign(new Error("Captcha verification failed"), { statusCode: 403 });
        }
    }

    // Store token hash for anti-replay + mark session verified
    await pool.query(
        `INSERT INTO used_captcha_tokens (token_hash, session_id) VALUES ($1, $2)
     ON CONFLICT (token_hash) DO NOTHING`,
        [tokenHash, sessionId]
    );

    await pool.query(
        `UPDATE monetization_sessions SET captcha_verified = true, captcha_token_hash = $1 WHERE id = $2`,
        [tokenHash, sessionId]
    );

    logger.info(`[OFFICIAL] Captcha verified for session ${sessionId}`);

    return { verified: true };
};

/**
 * Complete the Official Gateway flow and generate the key.
 *
 * Guard checks:
 * - All checkpoints completed
 * - Captcha verified (if required)
 * - Session not yet used
 * - HMAC + IP binding valid
 *
 * @param {string} sessionId
 * @param {string} signature
 * @param {string} clientIp
 * @param {string} userAgent
 * @returns {Object} { key, expiresAt, provider, slug }
 */
export const completeOfficial = async (sessionId, signature, clientIp, userAgent) => {
    const session = await loadOfficialSession(sessionId, signature, clientIp, userAgent);

    // Guard: all checkpoints must be completed
    if (session.checkpoint_index < session.total_checkpoints) {
        throw Object.assign(
            new Error(`Checkpoint ${session.checkpoint_index} of ${session.total_checkpoints} completed. Finish all checkpoints first.`),
            { statusCode: 403 }
        );
    }

    // Guard: captcha must be verified (if enabled in settings)
    const captchaRequired = session.captcha_enabled !== false;
    if (captchaRequired && !session.captcha_verified) {
        throw Object.assign(new Error("Captcha verification required before key generation"), { statusCode: 403 });
    }

    // Guard: anti-speedrun — total elapsed time must be reasonable
    if (!config.isDevelopment) {
        const timerPerCheckpoint = session.checkpoint_timer_seconds || 10;
        const minTotalSeconds = timerPerCheckpoint * session.total_checkpoints;
        const totalElapsed = (Date.now() - new Date(session.created_at).getTime()) / 1000;

        if (totalElapsed < minTotalSeconds) {
            logger.warn(`[OFFICIAL] Total time too fast: ${totalElapsed.toFixed(1)}s < ${minTotalSeconds}s for session ${sessionId}`);
            throw Object.assign(new Error("Completed too quickly — suspected bypass"), { statusCode: 403 });
        }
    }

    // Atomic mark-as-used
    const updateResult = await pool.query(
        `UPDATE monetization_sessions SET used = true, completed_at = NOW() WHERE id = $1 AND used = false RETURNING id`,
        [sessionId]
    );

    if (updateResult.rowCount === 0) {
        throw Object.assign(new Error("Session already consumed"), { statusCode: 409 });
    }

    // Check plan key quota before generating
    await checkOwnerKeyQuota(session.owner_id);

    // Generate license key
    const keyDurationHours = session.key_duration_hours || 6;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + keyDurationHours);

    const ipHash = sha256(clientIp);
    const keys = await keysService.generateKeys({
        scriptId: session.script_id,
        ownerId: session.owner_id,
        type: "timed",
        maxDevices: 1,
        expiresAt,
        note: `GetFreeKey | official | IP: ${ipHash.substring(0, 8)}...`,
        quantity: 1,
    });

    const generatedKey = keys[0];

    logger.info(`[OFFICIAL] Key generated: ${generatedKey.key_value} | session=${sessionId}`);

    return {
        key: generatedKey.key_value,
        expiresAt: new Date(generatedKey.expires_at).toISOString(),
        provider: "official",
        slug: session.script_slug,
    };
};

/**
 * Get official session status for frontend to resume the checkpoint flow.
 *
 * @param {string} sessionId
 * @param {string} signature
 * @param {string} clientIp
 * @param {string} userAgent
 * @returns {Object} Current session state
 */
export const getOfficialStatus = async (sessionId, signature, clientIp, userAgent) => {
    const session = await loadOfficialSession(sessionId, signature, clientIp, userAgent);

    const checkpoints = session.checkpoints_json || [];
    const currentIndex = session.checkpoint_index || 0;
    const totalCheckpoints = session.total_checkpoints || 0;
    const timerSeconds = session.checkpoint_timer_seconds || 10;
    const captchaEnabled = session.captcha_enabled !== false;

    // Calculate remaining countdown for current checkpoint
    const referenceTime = session.last_checkpoint_at || session.created_at;
    const elapsedSeconds = (Date.now() - new Date(referenceTime).getTime()) / 1000;
    const remainingSeconds = Math.max(0, Math.ceil(timerSeconds - elapsedSeconds));

    // Get current checkpoint info
    const currentCheckpoint = currentIndex < totalCheckpoints ? checkpoints[currentIndex] : null;

    return {
        currentIndex,
        totalCheckpoints,
        currentCheckpoint,
        allCheckpoints: checkpoints,
        timerSeconds,
        remainingSeconds,
        captchaEnabled,
        captchaVerified: session.captcha_verified || false,
        checkpointsCompleted: currentIndex >= totalCheckpoints,
    };
};

/**
 * Cleanup expired/abandoned sessions (older than 1 hour, not used).
 */
export const cleanupExpiredSessions = async () => {
    const result = await pool.query(
        `DELETE FROM monetization_sessions
     WHERE used = false AND created_at < NOW() - INTERVAL '1 hour'`
    );
    if (result.rowCount > 0) {
        logger.info(`[MONETIZATION] Cleaned up ${result.rowCount} expired sessions`);
    }
    return result.rowCount;
};
