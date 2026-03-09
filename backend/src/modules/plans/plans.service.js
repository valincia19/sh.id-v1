import pool from "../../db/postgres.js";

/**
 * Get or create user's plan
 * @param {string} userId
 * @returns {Object} User plan
 */
export const getPlanLimits = (planType = 'free') => {
    switch (planType) {
        case 'pro':
            return {
                maximum_obfuscation: 50,
                maximum_keys: 5000,
                maximum_deployments: 1000,
                maximum_devices_per_key: 2
            };
        case 'enterprise':
            return {
                maximum_obfuscation: 50000,
                maximum_keys: 50000,
                maximum_deployments: 10000,
                maximum_devices_per_key: 10
            };
        case 'custom':
            return {
                maximum_obfuscation: 50000,
                maximum_keys: 50000,
                maximum_deployments: 10000,
                maximum_devices_per_key: 50
            };
        default: // free
            return {
                maximum_obfuscation: 3,
                maximum_keys: 10,
                maximum_deployments: 50,
                maximum_devices_per_key: 1
            };
    }
};

export const getUserPlan = async (userId) => {
    let result = await pool.query(
        `SELECT * FROM user_plans WHERE user_id = $1`,
        [userId]
    );

    if (result.rows.length === 0) {
        // New user gets 30-day free trial
        result = await pool.query(
            `INSERT INTO user_plans (user_id, plan_type, started_at, expires_at) VALUES ($1, 'free', NOW(), NOW() + INTERVAL '30 days') RETURNING *`,
            [userId]
        );
        return result.rows[0];
    }

    let plan = result.rows[0];

    // Handle Plan Expiration
    if (plan.expires_at && new Date() > new Date(plan.expires_at)) {
        if (plan.plan_type === 'free') {
            // Free trial expired → set all quotas to 0, don't renew
            // User must upgrade to continue
            await pool.query(
                `UPDATE user_maximums SET maximum_obfuscation = 0, maximum_keys = 0, maximum_deployments = 0, maximum_devices_per_key = 0, updated_at = NOW() WHERE user_id = $1`,
                [userId]
            );
        } else {
            // Paid plan expired → downgrade to free (also expired, no quota)
            const downgradeResult = await pool.query(
                `UPDATE user_plans SET plan_type = 'free', started_at = started_at, updated_at = NOW() WHERE user_id = $1 RETURNING *`,
                [userId]
            );
            plan = downgradeResult.rows[0];

            // Reset all quotas to 0
            await pool.query(
                `UPDATE user_maximums SET maximum_obfuscation = 0, maximum_keys = 0, maximum_deployments = 0, maximum_devices_per_key = 0, updated_at = NOW() WHERE user_id = $1`,
                [userId]
            );
        }
    }

    return plan;
};

/**
 * Get or create user's maximums based on their plan
 * @param {string} userId
 * @param {string} planType
 * @returns {Object} User maximums
 */
export const getUserMaximums = async (userId, planType = 'free') => {
    let result = await pool.query(
        `SELECT * FROM user_maximums WHERE user_id = $1`,
        [userId]
    );

    if (result.rows.length === 0) {
        let obsMax = 3;
        let keyMax = 10;
        let devMax = 50;
        let devPerKey = 1;

        if (planType === 'pro') {
            obsMax = 50;
            keyMax = 5000;
            devMax = 1000;
            devPerKey = 2;
        } else if (planType === 'enterprise') {
            obsMax = 50000;
            keyMax = 50000;
            devMax = 10000;
            devPerKey = 10;
        } else if (planType === 'custom') {
            obsMax = 50000;
            keyMax = 50000;
            devMax = 10000;
            devPerKey = 50;
        }

        result = await pool.query(
            `INSERT INTO user_maximums (user_id, maximum_obfuscation, maximum_keys, maximum_deployments, maximum_devices_per_key) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, obsMax, keyMax, devMax, devPerKey]
        );
    } else {
        // Check if maximums need monthly reset
        const maximums = result.rows[0];
        const isResetDue = new Date() > new Date(maximums.maximums_reset_at);

        if (isResetDue) {
            let obsMax = 3;
            let keyMax = 10;
            let devMax = 50;
            let devPerKey = 1;

            if (planType === 'pro') {
                obsMax = 50;
                keyMax = 5000;
                devMax = 1000;
                devPerKey = 2;
            } else if (planType === 'enterprise') {
                obsMax = 50000;
                keyMax = 50000;
                devMax = 10000;
                devPerKey = 10;
            } else if (planType === 'custom') {
                obsMax = 50000;
                keyMax = 50000;
                devMax = 10000;
                devPerKey = 50;
            }

            result = await pool.query(
                `UPDATE user_maximums
                 SET maximum_obfuscation = $2,
                     maximum_keys = $3,
                     maximum_deployments = $4,
                     maximum_devices_per_key = $5,
                     maximums_reset_at = (NOW() + INTERVAL '30 days'),
                     updated_at = NOW()
                 WHERE user_id = $1 RETURNING *`,
                [userId, obsMax, keyMax, devMax, devPerKey]
            );
        }
    }

    return result.rows[0];
};

/**
 * Get unified plan and maximums for user
 * @param {string} userId
 * @returns {Object} { plan, maximums }
 */
export const getUserPlanWithMaximums = async (userId) => {
    const plan = await getUserPlan(userId);
    const maximums = await getUserMaximums(userId, plan.plan_type);
    const limits = getPlanLimits(plan.plan_type);

    return { plan, maximums, limits };
};

/**
 * Deduct a maximum of specific type
 * @param {string} userId
 * @param {string} maximumType 'maximum_obfuscation' | 'maximum_keys' | 'maximum_deployments'
 * @param {number} amount
 * @returns {Object} Remaining maximums, throws if insufficient
 */
export const deductMaximum = async (userId, maximumType, amount = 1) => {
    const validTypes = ['maximum_obfuscation', 'maximum_keys', 'maximum_deployments'];
    if (!validTypes.includes(maximumType)) throw new Error('Invalid maximum type');

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Lock row
        const maximumsResult = await client.query(
            `SELECT * FROM user_maximums WHERE user_id = $1 FOR UPDATE`,
            [userId]
        );

        if (maximumsResult.rows.length === 0) {
            throw new Error('User maximums not found');
        }

        const maximums = maximumsResult.rows[0];
        if (maximums[maximumType] < amount) {
            throw new Error(`Insufficient ${maximumType}. Required: ${amount}, Available: ${maximums[maximumType]}`);
        }

        const updateResult = await client.query(
            `UPDATE user_maximums SET ${maximumType} = ${maximumType} - $2, updated_at = NOW() WHERE user_id = $1 RETURNING *`,
            [userId, amount]
        );

        await client.query("COMMIT");
        return updateResult.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Verify if user can generate more keys (quota limit)
 * Only counts keys that are 'active' or 'unused'
 * @param {string} userId
 * @param {number} requestedQuantity
 * @returns {boolean} true if allowed, throws if limit exceeded
 */
export const verifyKeyQuota = async (userId, requestedQuantity) => {
    const maximums = await getUserMaximums(userId);
    const maxKeys = maximums.maximum_keys;

    const result = await pool.query(
        `SELECT COUNT(*) as count FROM license_keys WHERE owner_id = $1 AND status IN ('unused', 'active')`,
        [userId]
    );
    const activeKeys = parseInt(result.rows[0].count, 10);

    if (activeKeys + requestedQuantity > maxKeys) {
        throw new Error(`Limit reached. You currently have ${activeKeys} valid keys out of your ${maxKeys} maximum limit. Cannot generate ${requestedQuantity} more.`);
    }

    return true;
};
