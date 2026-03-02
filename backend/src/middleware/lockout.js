import redisClient from '../db/redis.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

// ============================================
// Account Lockout Configuration
// ============================================
const LOCKOUT_CONFIG = {
    // Number of failed attempts before lockout
    maxAttempts: parseInt(process.env.LOCKOUT_MAX_ATTEMPTS || '5', 10),
    // Lockout duration in seconds (default: 15 minutes)
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900', 10),
    // Window for counting attempts in seconds (default: 15 minutes)
    attemptWindow: parseInt(process.env.LOCKOUT_ATTEMPT_WINDOW || '900', 10),
    // Time until attempt count decays (default: 5 minutes per decay)
    decayTime: parseInt(process.env.LOCKOUT_DECAY_TIME || '300', 10),
};

// Redis key prefixes
const PREFIX_ATTEMPTS = 'lockout:attempts:';
const PREFIX_LOCKED = 'lockout:locked:';
const PREFIX_IP_ATTEMPTS = 'lockout:ip:';

// ============================================
// Helper Functions
// ============================================

const getAttemptKey = (identifier, ip) => `${PREFIX_ATTEMPTS}${identifier.toLowerCase()}:${ip}`;
const getLockKey = (identifier, ip) => `${PREFIX_LOCKED}${identifier.toLowerCase()}:${ip}`;
const getIpKey = (ip) => `${PREFIX_IP_ATTEMPTS}${ip}`;

// ============================================
// Account Lockout Service
// ============================================

/**
 * Check if an account is currently locked
 * @param {string} identifier - Username or email
 * @param {string} ipAddress - Client IP address
 * @returns {Object} { isLocked: boolean, remainingTime: number, reason: string }
 */
export const isAccountLocked = async (identifier, ipAddress = 'unknown') => {
    try {
        const lockKey = getLockKey(identifier, ipAddress);
        const lockData = await redisClient.get(lockKey);

        if (!lockData) {
            return { isLocked: false, remainingTime: 0, reason: null };
        }

        const ttl = await redisClient.ttl(lockKey);
        const lockInfo = JSON.parse(lockData);

        return {
            isLocked: true,
            remainingTime: Math.max(0, ttl),
            reason: lockInfo.reason || 'Too many failed login attempts',
            lockedAt: lockInfo.lockedAt,
            attemptCount: lockInfo.attemptCount,
        };
    } catch (error) {
        logger.error('Lockout check error for %s: %o', identifier, error);
        // On error, don't lock - fail open for availability
        return { isLocked: false, remainingTime: 0, reason: null };
    }
};

/**
 * Record a failed login attempt
 * @param {string} identifier - Username or email
 * @param {string} ipAddress - Client IP address
 * @returns {Object} { attempts: number, isLocked: boolean, remainingTime: number }
 */
export const recordFailedAttempt = async (identifier, ipAddress = 'unknown') => {
    try {
        const attemptKey = getAttemptKey(identifier, ipAddress);
        const lockKey = getLockKey(identifier, ipAddress);
        const ipKey = getIpKey(ipAddress);

        // Increment attempt counter
        const attempts = await redisClient.incr(attemptKey);

        // Set expiry on first attempt
        if (attempts === 1) {
            await redisClient.expire(attemptKey, LOCKOUT_CONFIG.attemptWindow);
        }

        // Also track IP-based attempts (for distributed attack detection)
        const ipAttempts = await redisClient.incr(ipKey);
        if (ipAttempts === 1) {
            await redisClient.expire(ipKey, LOCKOUT_CONFIG.attemptWindow);
        }

        // Check if we should lock the account
        if (attempts >= LOCKOUT_CONFIG.maxAttempts) {
            // Lock the account
            const lockInfo = {
                lockedAt: new Date().toISOString(),
                attemptCount: attempts,
                reason: 'Too many failed login attempts',
                ipAddress,
            };

            await redisClient.setEx(
                lockKey,
                LOCKOUT_CONFIG.lockoutDuration,
                JSON.stringify(lockInfo)
            );

            // Clear the attempt counter since we've locked
            await redisClient.del(attemptKey);

            logger.warn('Account locked: %s after %d attempts from IP %s',
                identifier, attempts, ipAddress);

            return {
                attempts,
                isLocked: true,
                remainingTime: LOCKOUT_CONFIG.lockoutDuration,
                message: `Account locked due to too many failed attempts. Try again in ${Math.ceil(LOCKOUT_CONFIG.lockoutDuration / 60)} minutes.`,
            };
        }

        const ttl = await redisClient.ttl(attemptKey);
        const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - attempts;

        return {
            attempts,
            isLocked: false,
            remainingTime: ttl,
            remainingAttempts,
            message: remainingAttempts > 1
                ? `${remainingAttempts} attempts remaining before lockout`
                : 'Warning: 1 attempt remaining before account lockout',
        };
    } catch (error) {
        logger.error('Record failed attempt error for %s: %o', identifier, error);
        // Fail open - don't block login on Redis errors
        return { attempts: 0, isLocked: false, remainingTime: 0 };
    }
};

/**
 * Clear failed attempts after successful login
 * @param {string} identifier - Username or email
 * @param {string} ipAddress - Client IP address
 */
export const clearFailedAttempts = async (identifier, ipAddress = 'unknown') => {
    try {
        const attemptKey = getAttemptKey(identifier, ipAddress);
        await redisClient.del(attemptKey);
        logger.debug('Cleared failed attempts for %s', identifier);
    } catch (error) {
        logger.error('Clear attempts error for %s: %o', identifier, error);
    }
};

/**
 * Manually unlock an account (admin action)
 * @param {string} identifier - Username or email
 * @param {string} ipAddress - Client IP address
 * @returns {boolean} Whether the unlock was successful
 */
export const unlockAccount = async (identifier, ipAddress = 'unknown') => {
    try {
        const lockKey = getLockKey(identifier, ipAddress);
        const attemptKey = getAttemptKey(identifier, ipAddress);

        await redisClient.del(lockKey);
        await redisClient.del(attemptKey);

        logger.info('Account unlocked: %s', identifier);
        return true;
    } catch (error) {
        logger.error('Unlock account error for %s: %o', identifier, error);
        return false;
    }
};

/**
 * Get lockout status for an account (for admin use)
 * @param {string} identifier - Username or email
 * @param {string} ipAddress - Client IP address
 * @returns {Object} Lockout status details
 */
export const getLockoutStatus = async (identifier, ipAddress = 'unknown') => {
    try {
        const attemptKey = getAttemptKey(identifier, ipAddress);
        const lockKey = getLockKey(identifier, ipAddress);

        const [attempts, lockData] = await Promise.all([
            redisClient.get(attemptKey),
            redisClient.get(lockKey),
        ]);

        const result = {
            identifier,
            isLocked: false,
            currentAttempts: parseInt(attempts || '0', 10),
            maxAttempts: LOCKOUT_CONFIG.maxAttempts,
            lockoutDuration: LOCKOUT_CONFIG.lockoutDuration,
        };

        if (lockData) {
            const lockInfo = JSON.parse(lockData);
            const ttl = await redisClient.ttl(lockKey);
            result.isLocked = true;
            result.remainingTime = ttl;
            result.lockedAt = lockInfo.lockedAt;
            result.lockReason = lockInfo.reason;
            result.lockedFromIp = lockInfo.ipAddress;
        }

        return result;
    } catch (error) {
        logger.error('Get lockout status error for %s: %o', identifier, error);
        return { identifier, isLocked: false, error: error.message };
    }
};

/**
 * Check if an IP has too many failed attempts (distributed attack detection)
 * @param {string} ipAddress - Client IP address
 * @returns {Object} { isBlocked: boolean, attempts: number }
 */
export const checkIpAttempts = async (ipAddress) => {
    try {
        const ipKey = getIpKey(ipAddress);
        const attempts = await redisClient.get(ipKey);
        const count = parseInt(attempts || '0', 10);

        // Block IP if too many attempts across different accounts
        const maxIpAttempts = LOCKOUT_CONFIG.maxAttempts * 3; // 15 attempts from same IP

        return {
            isBlocked: count >= maxIpAttempts,
            attempts: count,
            maxAttempts: maxIpAttempts,
        };
    } catch (error) {
        logger.error('Check IP attempts error for %s: %o', ipAddress, error);
        return { isBlocked: false, attempts: 0 };
    }
};

/**
 * Get all currently locked accounts (for admin dashboard)
 * @param {number} limit - Max results to return
 * @returns {Array} List of locked accounts
 */
export const getLockedAccounts = async (limit = 50) => {
    try {
        const lockedAccounts = [];
        let cursor = 0;

        // Use SCAN instead of KEYS for production safety
        do {
            const result = await redisClient.scan(cursor, {
                MATCH: `${PREFIX_LOCKED}*`,
                COUNT: 50,
            });

            cursor = result.cursor;

            for (const key of result.keys) {
                if (lockedAccounts.length >= limit) break;
                // parsing key: lockout:locked:identifier:ip
                const parts = key.replace(PREFIX_LOCKED, '').split(':');
                const identifier = parts[0];
                const ipAddress = parts.slice(1).join(':') || 'unknown';
                const status = await getLockoutStatus(identifier, ipAddress);
                lockedAccounts.push(status);
            }
        } while (cursor !== 0 && lockedAccounts.length < limit);

        return lockedAccounts.sort((a, b) =>
            new Date(b.lockedAt).getTime() - new Date(a.lockedAt).getTime()
        );
    } catch (error) {
        logger.error('Get locked accounts error: %o', error);
        return [];
    }
};

export default {
    isAccountLocked,
    recordFailedAttempt,
    clearFailedAttempts,
    unlockAccount,
    getLockoutStatus,
    checkIpAttempts,
    getLockedAccounts,
    config: LOCKOUT_CONFIG,
};
