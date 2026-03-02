import pool from "../../db/postgres.js";
import crypto from "crypto";

/**
 * Generate a unique key value in the format SH-idXXXXXXXXXXXXXXXXXXXXXX
 * @returns {string}
 */
const generateKeyValue = () => {
    const random = crypto.randomBytes(12).toString("hex"); // 24 hex chars
    return `SH-id${random}`;
};

/**
 * Generate multiple license keys
 * @param {Object} data - { scriptId, ownerId, type, maxDevices, expiresAt, note, quantity }
 * @returns {Array} Created keys
 */
export const generateKeys = async (data) => {
    const { scriptId, ownerId, type, maxDevices, expiresInDays, expiresAt, note, quantity } = data;
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const keys = [];
        for (let i = 0; i < quantity; i++) {
            const keyValue = generateKeyValue();
            const result = await client.query(
                `INSERT INTO license_keys (key_value, script_id, owner_id, type, status, max_devices, expires_in_days, expires_at, note)
                 VALUES ($1, $2, $3, $4, 'unused', $5, $6, $7, $8)
                 RETURNING *`,
                [keyValue, scriptId, ownerId, type, maxDevices, expiresInDays || null, expiresAt || null, note || null]
            );
            keys.push(result.rows[0]);
        }

        await client.query("COMMIT");
        return keys;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get keys owned by user with pagination
 * @param {string} ownerId
 * @param {Object} options - { page, limit, status, scriptId }
 * @returns {Object} { keys, total, page, totalPages }
 */
export const getMyKeys = async (ownerId, options = {}) => {
    // Auto-expire keys first before fetching
    await pool.query(
        `UPDATE license_keys 
         SET status = 'expired', updated_at = NOW() 
         WHERE owner_id = $1 AND expires_at < NOW() AND status IN ('active', 'unused')`,
        [ownerId]
    );

    const { page = 1, limit = 20, status, scriptId, search } = options;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE lk.owner_id = $1";
    const values = [ownerId];
    let paramIndex = 2;

    if (status) {
        whereClause += ` AND lk.status = $${paramIndex}`;
        values.push(status);
        paramIndex++;
    }
    if (scriptId) {
        whereClause += ` AND lk.script_id = $${paramIndex}`;
        values.push(scriptId);
        paramIndex++;
    }
    if (search) {
        whereClause += ` AND (lk.key_value ILIKE $${paramIndex} OR lk.note ILIKE $${paramIndex})`;
        values.push(`%${search}%`);
        paramIndex++;
    }

    // Count total
    const countResult = await pool.query(
        `SELECT COUNT(*)::int as total FROM license_keys lk ${whereClause}`,
        values
    );
    const total = countResult.rows[0].total;

    // Get keys with script name, device count, and latest execution telemetry
    const keysResult = await pool.query(
        `SELECT lk.*, s.title as script_name,
            (SELECT COUNT(*)::int FROM key_devices kd WHERE kd.key_id = lk.id) as devices_used,
            (SELECT executor_name FROM execution_logs el WHERE el.key_id = lk.id AND el.is_success = true ORDER BY el.created_at DESC LIMIT 1) as last_executor,
            (SELECT roblox_username FROM execution_logs el WHERE el.key_id = lk.id AND el.is_success = true ORDER BY el.created_at DESC LIMIT 1) as last_roblox_username
         FROM license_keys lk
         JOIN scripts s ON lk.script_id = s.id
         ${whereClause}
         ORDER BY lk.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...values, limit, offset]
    );

    return {
        keys: keysResult.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};

/**
 * Get key analytics/stats for a user
 * @param {string} ownerId
 * @returns {Object} Stats
 */
export const getKeyStats = async (ownerId) => {
    // Auto-expire keys first before calculating stats
    await pool.query(
        `UPDATE license_keys 
         SET status = 'expired', updated_at = NOW() 
         WHERE owner_id = $1 AND expires_at < NOW() AND status IN ('active', 'unused')`,
        [ownerId]
    );

    const result = await pool.query(
        `SELECT
            COUNT(*) FILTER (WHERE status = 'active')::int as total_active,
            COUNT(*) FILTER (WHERE status = 'expired')::int as total_expired,
            COUNT(*) FILTER (WHERE status = 'revoked')::int as total_revoked,
            COUNT(*) FILTER (WHERE status = 'unused')::int as total_unused,
            (SELECT COUNT(*)::int FROM key_devices kd
             JOIN license_keys lk2 ON kd.key_id = lk2.id
             WHERE lk2.owner_id = $1) as total_devices
         FROM license_keys
         WHERE owner_id = $1`,
        [ownerId]
    );
    return result.rows[0];
};

/**
 * Get a single key by ID with its devices
 * @param {string} keyId
 * @returns {Object} Key with devices
 */
export const getKeyById = async (keyId) => {
    // Auto expire before fetching single key
    await pool.query(
        `UPDATE license_keys 
         SET status = 'expired', updated_at = NOW() 
         WHERE id = $1 AND expires_at < NOW() AND status IN ('active', 'unused')`,
        [keyId]
    );

    const keyResult = await pool.query(
        `SELECT lk.*, s.title as script_name
         FROM license_keys lk
         JOIN scripts s ON lk.script_id = s.id
         WHERE lk.id = $1`,
        [keyId]
    );
    if (keyResult.rows.length === 0) return null;

    const devicesResult = await pool.query(
        `SELECT kd.*,
            (SELECT executor_name FROM execution_logs el WHERE el.key_id = kd.key_id AND el.hwid = kd.hwid AND el.is_success = true ORDER BY el.created_at DESC LIMIT 1) as last_executor,
            (SELECT roblox_username FROM execution_logs el WHERE el.key_id = kd.key_id AND el.hwid = kd.hwid AND el.is_success = true ORDER BY el.created_at DESC LIMIT 1) as last_roblox_username
         FROM key_devices kd 
         WHERE kd.key_id = $1 
         ORDER BY kd.last_seen_at DESC`,
        [keyId]
    );

    return {
        ...keyResult.rows[0],
        devices: devicesResult.rows,
    };
};

/**
 * Revoke a key
 * @param {string} keyId
 * @param {string} ownerId
 * @returns {Object} Updated key
 */
export const revokeKey = async (keyId, ownerId) => {
    const result = await pool.query(
        `UPDATE license_keys SET status = 'revoked' WHERE id = $1 AND owner_id = $2 RETURNING *`,
        [keyId, ownerId]
    );
    return result.rows[0];
};

/**
 * Delete a key
 * @param {string} keyId
 * @param {string} ownerId
 * @returns {boolean}
 */
export const deleteKey = async (keyId, ownerId) => {
    const result = await pool.query(
        `DELETE FROM license_keys WHERE id = $1 AND owner_id = $2`,
        [keyId, ownerId]
    );
    return result.rowCount > 0;
};

/**
 * Bulk Revoke keys
 * @param {Array<string>} keyIds
 * @param {string} ownerId
 * @returns {number} Number of revoked keys
 */
export const bulkRevokeKeys = async (keyIds, ownerId) => {
    if (!keyIds || keyIds.length === 0) return 0;
    const result = await pool.query(
        `UPDATE license_keys SET status = 'revoked' WHERE id = ANY($1::uuid[]) AND owner_id = $2 RETURNING id`,
        [keyIds, ownerId]
    );
    return result.rowCount;
};

/**
 * Bulk Delete keys
 * @param {Array<string>} keyIds
 * @param {string} ownerId
 * @returns {number} Number of deleted keys
 */
export const bulkDeleteKeys = async (keyIds, ownerId) => {
    if (!keyIds || keyIds.length === 0) return 0;
    const result = await pool.query(
        `DELETE FROM license_keys WHERE id = ANY($1::uuid[]) AND owner_id = $2`,
        [keyIds, ownerId]
    );
    return result.rowCount;
};

/**
 * Revoke (remove) a device from a key
 * @param {string} deviceId
 * @param {string} ownerId - to verify ownership
 * @returns {boolean}
 */
export const revokeDevice = async (deviceId, ownerId) => {
    const result = await pool.query(
        `DELETE FROM key_devices kd
         USING license_keys lk
         WHERE kd.id = $1 AND kd.key_id = lk.id AND lk.owner_id = $2`,
        [deviceId, ownerId]
    );
    return result.rowCount > 0;
};

/**
 * Reset HWID (remove all devices) from a key
 * @param {string} keyId
 * @param {string} ownerId
 * @returns {boolean}
 */
export const resetHwid = async (keyId, ownerId) => {
    // Delete all devices mapped to this key that is owned by ownerId
    const result = await pool.query(
        `DELETE FROM key_devices kd
         USING license_keys lk
         WHERE kd.key_id = $1 AND kd.key_id = lk.id AND lk.owner_id = $2`,
        [keyId, ownerId]
    );
    return result.rowCount > 0; // returns true if any devices were deleted
};

/**
 * Get user's key settings (create defaults if not found)
 * @param {string} userId
 * @returns {Object}
 */
export const getSettings = async (userId) => {
    let result = await pool.query(
        `SELECT * FROM key_settings WHERE user_id = $1`,
        [userId]
    );

    if (result.rows.length === 0) {
        result = await pool.query(
            `INSERT INTO key_settings (user_id) VALUES ($1) RETURNING *`,
            [userId]
        );
    }

    return result.rows[0];
};

/**
 * Update user's key settings
 * @param {string} userId
 * @param {Object} settings
 * @returns {Object}
 */
export const updateSettings = async (userId, settings) => {
    const {
        // Security settings
        deviceLockEnabled,
        maxDevicesPerKey,
        rateLimitingEnabled,
        autoExpireEnabled,
        hwidBlacklistEnabled,
        // GetKey settings
        getkeyEnabled,
        checkpointCount,
        adLinks,
        checkpointTimerSeconds,
        captchaEnabled,
        keyDurationHours,
        maxKeysPerIp,
        cooldownHours,
        // Provider settings
        workinkEnabled,
        linkvertiseEnabled,
        officialEnabled,
        workinkUrl,
        linkvertiseUrl,
    } = settings;

    // Get existing settings to merge with updates
    const existing = await pool.query(
        'SELECT * FROM key_settings WHERE user_id = $1',
        [userId]
    );

    const existingSettings = existing.rows[0] || {};

    // Merge with existing values (use new if provided, otherwise keep existing)
    const mergedSettings = {
        device_lock_enabled: deviceLockEnabled ?? existingSettings.device_lock_enabled ?? true,
        max_devices_per_key: maxDevicesPerKey ?? existingSettings.max_devices_per_key ?? 1,
        rate_limiting_enabled: rateLimitingEnabled ?? existingSettings.rate_limiting_enabled ?? true,
        auto_expire_enabled: autoExpireEnabled ?? existingSettings.auto_expire_enabled ?? false,
        hwid_blacklist_enabled: hwidBlacklistEnabled ?? existingSettings.hwid_blacklist_enabled ?? false,
        getkey_enabled: getkeyEnabled ?? existingSettings.getkey_enabled ?? false,
        ad_links: adLinks ?? existingSettings.ad_links ?? [],
        // Auto-derive checkpoint_count from ad_links + 1 (for the platform ad/gateway)
        checkpoint_count: adLinks ? (adLinks.length + 1) : (checkpointCount ?? existingSettings.checkpoint_count ?? 1),
        checkpoint_timer_seconds: checkpointTimerSeconds ?? existingSettings.checkpoint_timer_seconds ?? 10,
        captcha_enabled: captchaEnabled ?? existingSettings.captcha_enabled ?? true,
        key_duration_hours: keyDurationHours ?? existingSettings.key_duration_hours ?? 6,
        max_keys_per_ip: maxKeysPerIp ?? existingSettings.max_keys_per_ip ?? 1,
        cooldown_hours: cooldownHours ?? existingSettings.cooldown_hours ?? 24,
        workink_enabled: workinkEnabled ?? existingSettings.workink_enabled ?? false,
        linkvertise_enabled: linkvertiseEnabled ?? existingSettings.linkvertise_enabled ?? false,
        official_enabled: officialEnabled ?? existingSettings.official_enabled ?? true,
        workink_url: workinkUrl ?? existingSettings.workink_url ?? '',
        linkvertise_url: linkvertiseUrl ?? existingSettings.linkvertise_url ?? '',
    };

    // Upsert with all settings
    const result = await pool.query(
        `INSERT INTO key_settings (
            user_id, 
            device_lock_enabled, max_devices_per_key, rate_limiting_enabled, auto_expire_enabled, hwid_blacklist_enabled,
            getkey_enabled, checkpoint_count, ad_links, checkpoint_timer_seconds, captcha_enabled, key_duration_hours, max_keys_per_ip, cooldown_hours,
            workink_enabled, linkvertise_enabled, official_enabled, workink_url, linkvertise_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (user_id) DO UPDATE SET
            device_lock_enabled = EXCLUDED.device_lock_enabled,
            max_devices_per_key = EXCLUDED.max_devices_per_key,
            rate_limiting_enabled = EXCLUDED.rate_limiting_enabled,
            auto_expire_enabled = EXCLUDED.auto_expire_enabled,
            hwid_blacklist_enabled = EXCLUDED.hwid_blacklist_enabled,
            getkey_enabled = EXCLUDED.getkey_enabled,
            checkpoint_count = EXCLUDED.checkpoint_count,
            ad_links = EXCLUDED.ad_links,
            checkpoint_timer_seconds = EXCLUDED.checkpoint_timer_seconds,
            captcha_enabled = EXCLUDED.captcha_enabled,
            key_duration_hours = EXCLUDED.key_duration_hours,
            max_keys_per_ip = EXCLUDED.max_keys_per_ip,
            cooldown_hours = EXCLUDED.cooldown_hours,
            workink_enabled = EXCLUDED.workink_enabled,
            linkvertise_enabled = EXCLUDED.linkvertise_enabled,
            official_enabled = EXCLUDED.official_enabled,
            workink_url = EXCLUDED.workink_url,
            linkvertise_url = EXCLUDED.linkvertise_url,
            updated_at = NOW()
        RETURNING *`,
        [
            userId,
            mergedSettings.device_lock_enabled,
            mergedSettings.max_devices_per_key,
            mergedSettings.rate_limiting_enabled,
            mergedSettings.auto_expire_enabled,
            mergedSettings.hwid_blacklist_enabled,
            mergedSettings.getkey_enabled,
            mergedSettings.checkpoint_count,
            mergedSettings.ad_links,
            mergedSettings.checkpoint_timer_seconds,
            mergedSettings.captcha_enabled,
            mergedSettings.key_duration_hours,
            mergedSettings.max_keys_per_ip,
            mergedSettings.cooldown_hours,
            mergedSettings.workink_enabled,
            mergedSettings.linkvertise_enabled,
            mergedSettings.official_enabled,
            mergedSettings.workink_url,
            mergedSettings.linkvertise_url,
        ]
    );

    return result.rows[0];
};

/**
 * Get user's scripts for the generate modal dropdown
 * @param {string} ownerId
 * @returns {Array}
 */
export const getUserScripts = async (ownerId) => {
    const result = await pool.query(
        `SELECT id, title FROM scripts WHERE owner_id = $1 AND deleted_at IS NULL ORDER BY title ASC`,
        [ownerId]
    );
    return result.rows;
};

/**
 * Get public script info for the key landing page
 * @param {string} slug 
 * @returns {Object} Script info
 */
export const getPublicScriptInfo = async (slug) => {
    const query = `
        SELECT 
            s.title, s.description, s.slug, s.thumbnail_url,
            g.name as game_name, g.logo_url as game_logo_url,
            h.name as hub_name, h.logo_url as hub_logo_url, h.is_verified, h.is_official,
            u.username as owner_username, u.avatar_url as owner_avatar_url
        FROM scripts s
        LEFT JOIN games g ON s.game_id = g.id
        LEFT JOIN hubs h ON s.hub_id = h.id
        LEFT JOIN users u ON s.owner_id = u.id
        WHERE s.slug = $1 AND s.deleted_at IS NULL AND s.status = 'published'
    `;
    const result = await pool.query(query, [slug]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
        title: row.title,
        description: row.description,
        slug: row.slug,
        thumbnail_url: row.thumbnail_url,
        game: row.game_name ? {
            name: row.game_name,
            logo_url: row.game_logo_url
        } : null,
        hub: row.hub_name ? {
            name: row.hub_name,
            logo_url: row.hub_logo_url,
            is_verified: row.is_verified,
            is_official: row.is_official
        } : null,
        owner: {
            username: row.owner_username,
            avatar_url: row.owner_avatar_url
        }
    };
};


