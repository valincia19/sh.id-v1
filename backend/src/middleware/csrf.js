import crypto from 'crypto';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// ============================================
// CSRF Protection Middleware
// ============================================
// Uses the Signed Double-Submit Cookie pattern
// - A CSRF token is generated and stored in an HttpOnly cookie
// - Client must send the token back via X-CSRF-Token header
// - Token is validated using HMAC signature

const CSRF_SECRET = config.security.sessionSecret || 'csrf-secret-change-in-production';
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

// Paths that should be excluded from CSRF protection
const CSRF_EXCLUDED_PATHS = [
    // Authentication endpoints (need to work before session)
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/auth/discord',
    '/api/auth/discord/callback',
    // Public CDN endpoints (no auth required, read-only semantic)
    '/v1/challenge',
    '/v1/verify',
    // Public GetKey endpoints (have own rate limiting, no auth required)
    '/api/keys/public/start-session',
    '/api/keys/public/complete-checkpoint',
    '/api/keys/public/verify-captcha',
    '/api/keys/public/getkey',
    // Official Gateway endpoints (session-token authenticated)
    '/api/keys/public/official/advance',
    '/api/keys/public/official/verify-captcha',
    '/api/keys/public/official/complete',
];

// Check if path matches excluded patterns
const isExcludedPath = (path) => {
    // Exact matches
    if (CSRF_EXCLUDED_PATHS.includes(path)) return true;

    // Pattern matches for dynamic routes
    if (path.startsWith('/v1/') && !path.includes('/api/')) return true; // CDN routes
    if (path.startsWith('/api/auth/discord/')) return true; // OAuth callbacks
    if (path.startsWith('/api/keys/public/session/')) return true; // Public session info (GET)
    if (path.startsWith('/api/keys/public/script/')) return true; // Public script info (GET)
    if (path === '/health') return true;
    if (path === '/api/status') return true;
    if (path === '/api/ping') return true;
    if (path === '/api/stats') return true;

    return false;
};

/**
 * Generate a signed CSRF token
 * @returns {Object} { token, signedToken }
 */
const generateCsrfToken = () => {
    const rawToken = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
    const signature = crypto
        .createHmac('sha256', CSRF_SECRET)
        .update(rawToken)
        .digest('hex');
    return {
        token: rawToken,
        signedToken: `${rawToken}.${signature}`,
    };
};

/**
 * Verify a CSRF token
 * @param {string} signedToken - The token from the client
 * @returns {boolean} Whether the token is valid
 */
const verifyCsrfToken = (signedToken) => {
    if (!signedToken || typeof signedToken !== 'string') return false;

    const parts = signedToken.split('.');
    if (parts.length !== 2) return false;

    const [rawToken, signature] = parts;

    // Verify signature
    const expectedSignature = crypto
        .createHmac('sha256', CSRF_SECRET)
        .update(rawToken)
        .digest('hex');

    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch {
        return false;
    }
};

/**
 * Middleware to generate and set CSRF token cookie
 * Should be called on initial page load or when a new token is needed
 */
export const generateCsrfTokenMiddleware = (req, res, next) => {
    const { signedToken } = generateCsrfToken();

    res.cookie(CSRF_COOKIE_NAME, signedToken, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
    });

    // Also return the token in response for client to use in headers
    res.locals.csrfToken = signedToken;

    next();
};

/**
 * Endpoint to get a fresh CSRF token
 * GET /api/csrf-token
 */
export const getCsrfToken = (req, res) => {
    const { signedToken } = generateCsrfToken();

    res.cookie(CSRF_COOKIE_NAME, signedToken, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
    });

    res.json({
        success: true,
        data: {
            csrfToken: signedToken,
        },
    });
};

/**
 * Middleware to validate CSRF token on state-changing requests
 * Should be applied to all POST, PUT, PATCH, DELETE requests
 */
export const csrfProtection = (req, res, next) => {
    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip excluded paths
    if (isExcludedPath(req.path)) {
        return next();
    }

    // Get token from header
    const headerToken = req.headers[CSRF_HEADER_NAME];

    // Get token from cookie
    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];

    // Validate both tokens exist and match
    if (!headerToken || !cookieToken) {
        logger.warn(`CSRF validation failed: missing token. Path: ${req.path}, IP: ${req.ip}`);
        return res.status(403).json({
            error: 'Forbidden',
            message: 'CSRF token missing. Please refresh the page and try again.',
            code: 'CSRF_TOKEN_MISSING',
        });
    }

    // Verify the header token is valid
    if (!verifyCsrfToken(headerToken)) {
        logger.warn(`CSRF validation failed: invalid header token. Path: ${req.path}, IP: ${req.ip}`);
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid CSRF token. Please refresh the page and try again.',
            code: 'CSRF_TOKEN_INVALID',
        });
    }

    // Verify the cookie token is valid
    if (!verifyCsrfToken(cookieToken)) {
        logger.warn(`CSRF validation failed: invalid cookie token. Path: ${req.path}, IP: ${req.ip}`);
        return res.status(403).json({
            error: 'Forbidden',
            message: 'CSRF session expired. Please refresh the page and try again.',
            code: 'CSRF_SESSION_EXPIRED',
        });
    }

    // Ensure tokens match
    if (headerToken !== cookieToken) {
        logger.warn(`CSRF validation failed: token mismatch. Path: ${req.path}, IP: ${req.ip}`);
        return res.status(403).json({
            error: 'Forbidden',
            message: 'CSRF token mismatch. Please refresh the page and try again.',
            code: 'CSRF_TOKEN_MISMATCH',
        });
    }

    next();
};

/**
 * Optional: Regenerate CSRF token after sensitive operations
 * Call this after login, password change, etc.
 */
export const regenerateCsrfToken = (req, res, next) => {
    const { signedToken } = generateCsrfToken();

    res.cookie(CSRF_COOKIE_NAME, signedToken, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
    });

    // Attach to response locals so it can be included in response if needed
    res.locals.newCsrfToken = signedToken;

    if (next) next();
    return signedToken;
};

export default {
    generateCsrfTokenMiddleware,
    getCsrfToken,
    csrfProtection,
    regenerateCsrfToken,
};
