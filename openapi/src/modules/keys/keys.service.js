import pool from "../../db/postgres.js";

/**
 * Validate a license key and optionally bind an HWID
 * Records telemetry data to execution_logs
 * @param {Object} data - { keyValue, scriptId, hwid, executorName, robloxUsername, robloxUserId, ipAddress }
 * @returns {Object} { valid, key, message }
 */
export const validateKey = async ({ keyValue, scriptId, hwid, executorName, robloxUsername, robloxUserId, ipAddress }) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Helper to log executions
        const logExecution = async (keyId, isSuccess, failureReason) => {
            await client.query(
                `INSERT INTO execution_logs (key_id, hwid, ip_address, executor_name, roblox_username, roblox_user_id, place_id, is_success, failure_reason)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [keyId, hwid || 'None', ipAddress || 'Unknown', executorName || null, robloxUsername || null, robloxUserId || null, data.placeId || null, isSuccess, failureReason || null]
            );
        };

        // 1. Look up the key
        const keyResult = await client.query(
            `SELECT lk.*, s.title as script_title, (lk.expires_at < NOW()) as is_expired_db
             FROM license_keys lk
             JOIN scripts s ON lk.script_id = s.id
             WHERE LOWER(lk.key_value) = LOWER($1)`,
            [keyValue]
        );

        if (keyResult.rows.length === 0) {
            // Cannot log key_id if key doesn't exist, log with NULL key
            await logExecution(null, false, "Invalid key. Key does not exist.");
            await client.query("COMMIT"); // Commit the log even if validation fails
            return { valid: false, message: "Invalid key. Key does not exist." };
        }

        const key = keyResult.rows[0];

        // 2. Check if key belongs to the correct script
        if (scriptId && key.script_id !== scriptId) {
            await logExecution(key.id, false, "Key does not belong to this script.");
            await client.query("COMMIT");
            return { valid: false, message: "Key does not belong to this script." };
        }

        // 3. Check key status
        if (key.status === "revoked") {
            await logExecution(key.id, false, "Key has been revoked by the owner.");
            await client.query("COMMIT");
            return { valid: false, message: "Key has been revoked by the owner." };
        }
        if (key.status === "expired") {
            await logExecution(key.id, false, "Key has expired.");
            await client.query("COMMIT");
            return { valid: false, message: "Key has expired." };
        }

        // 4. Check expiry for timed keys
        if (key.expires_at && key.is_expired_db) {
            await client.query(`UPDATE license_keys SET status = 'expired' WHERE id = $1`, [key.id]);
            await logExecution(key.id, false, "Key has expired.");
            await client.query("COMMIT");
            return { valid: false, message: "Key has expired." };
        }

        // 5. Handle HWID device binding
        if (hwid) {
            const devicesResult = await client.query(`SELECT * FROM key_devices WHERE key_id = $1`, [key.id]);
            const devices = devicesResult.rows;
            const existingDevice = devices.find(d => d.hwid === hwid);

            if (existingDevice) {
                await client.query(`UPDATE key_devices SET last_seen_at = NOW() WHERE id = $1`, [existingDevice.id]);
            } else {
                if (devices.length >= key.max_devices) {
                    await logExecution(key.id, false, `HWID Limit Reached. Bound to ${devices.length} max devices.`);
                    await client.query("COMMIT");
                    return {
                        valid: false,
                        message: `Device limit reached (${key.max_devices}). This key is already bound to ${devices.length} device(s).`,
                    };
                }
                await client.query(`INSERT INTO key_devices (key_id, hwid) VALUES ($1, $2)`, [key.id, hwid]);
            }
        }

        // 6. Activate key if unused
        if (key.status === "unused") {
            if (key.type === "timed" && key.expires_in_days > 0) {
                // First activation for a timed key - calculate fixed expires_at mapped from expires_in_days
                await client.query(
                    `UPDATE license_keys SET status = 'active', last_activity_at = NOW(), expires_at = NOW() + ($2 || ' days')::interval WHERE id = $1`,
                    [key.id, key.expires_in_days]
                );
            } else {
                await client.query(`UPDATE license_keys SET status = 'active', last_activity_at = NOW() WHERE id = $1`, [key.id]);
            }
        } else {
            await client.query(`UPDATE license_keys SET last_activity_at = NOW() WHERE id = $1`, [key.id]);
        }

        // Log successful execution
        await logExecution(key.id, true, null);

        await client.query("COMMIT");

        return {
            valid: true,
            message: "Key is valid.",
            key: {
                id: key.id,
                type: key.type,
                status: key.status === "unused" ? "active" : key.status,
                max_devices: key.max_devices,
                expires_at: key.expires_at,
                script_title: key.script_title,
            },
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
