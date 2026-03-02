import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.js';
import { query } from '../db/postgres.js';
import redisClient from '../db/redis.js';
import { loadUserRoles, loadUserPermissions } from './rbac.js';
import { isAccountLocked } from './lockout.js';

// ============================================
// Authentication Middleware
// ============================================

/**
 * Check account status with Redis cache (5 min TTL)
 */
const getAccountStatus = async (userId) => {
  const cacheKey = `user:status:${userId}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return cached;
  } catch { /* Redis down — fall through to DB */ }

  const result = await query(
    'SELECT account_status FROM users WHERE id = $1',
    [userId]
  );
  const status = result.rows[0]?.account_status || 'unknown';

  try {
    await redisClient.setEx(cacheKey, 300, status); // Cache 5 min
  } catch { /* ignore cache write failure */ }

  return status;
};

/**
 * Verify JWT token and attach fresh user data to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    let token = extractTokenFromHeader(authHeader);

    // Fallback to HttpOnly cookie for transparent auth
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach base user data
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
    };

    // ── Live RBAC Check ──────────────────────────────────────────
    // Instead of trusting stale JWT roles, we load fresh ones from Cache/DB
    const [roles, permissions] = await Promise.all([
      loadUserRoles(decoded.userId),
      loadUserPermissions(decoded.userId)
    ]);

    req.user.roles = roles;
    req.user.permissions = permissions;
    // ─────────────────────────────────────────────────────────────

    // ── Account status check (Redis-cached) ──────────────────────
    const accountStatus = await getAccountStatus(decoded.userId);
    if (accountStatus !== 'active') {
      return res.status(403).json({
        error: 'AccountSuspended',
        message: 'Your account has been suspended or deactivated.',
      });
    }
    // ─────────────────────────────────────────────────────────────

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TokenExpired',
        message: 'Access token has expired',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'InvalidToken',
        message: 'Invalid access token',
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Still loads fresh roles/permissions from cache/DB for security
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = extractTokenFromHeader(authHeader);

    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyAccessToken(token);

    // ── Security: Load fresh roles/permissions from cache/DB ───────────
    // Don't trust stale JWT roles - a user could have been demoted
    const [roles, permissions] = await Promise.all([
      loadUserRoles(decoded.userId),
      loadUserPermissions(decoded.userId)
    ]);
    
    // Check account status (cached in Redis)
    const accountStatus = await getAccountStatus(decoded.userId);
    if (accountStatus !== 'active') {
      // Account is suspended/deleted - treat as unauthenticated
      req.user = null;
      return next();
    }
    // ─────────────────────────────────────────────────────────────────

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      roles,
      permissions,
    };

    next();
  } catch (error) {
    // If token is invalid, just set user to null
    req.user = null;
    next();
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource',
    });
  }
  next();
};

export default {
  authenticate,
  optionalAuth,
  isAuthenticated,
};
