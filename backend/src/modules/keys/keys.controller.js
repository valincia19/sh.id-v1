import * as keysService from "./keys.service.js";
import * as plansService from "../plans/plans.service.js";
import { body, validationResult } from "express-validator";
import logger from "../../utils/logger.js";

/**
 * Validation rules for key generation
 */
export const generateKeysValidation = [
    body("scriptId").isUUID().withMessage("Valid script ID is required"),
    body("type").isIn(["lifetime", "timed", "device_locked"]).withMessage("Invalid key type"),
    body("maxDevices").isInt({ min: 1, max: 100 }).withMessage("Max devices must be between 1 and 100"),
    body("quantity").isInt({ min: 1, max: 100000 }).withMessage("Quantity must be between 1 and 10,000"),
    body("expiresInDays").optional().isInt({ min: 1, max: 3650 }).withMessage("Expiry must be between 1 and 3650 days"),
    body("note").optional().trim().isLength({ max: 200 }).withMessage("Note must be under 200 characters"),
];

/**
 * Generate new license keys
 * POST /api/keys/generate
 */
export const generateKeys = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error("Validation failed for /api/keys/generate:", errors.array(), "Body:", req.body);
            return res.status(400).json({ error: "ValidationError", details: errors.array() });
        }

        const { scriptId, type, maxDevices, quantity, expiresInDays, note } = req.body;
        const requestedQuantity = quantity || 1;

        // Verify quota limits first
        try {
            await plansService.verifyKeyQuota(req.user.userId, requestedQuantity);

            // Verify device limit per key matches user's plan
            const maximums = await plansService.getUserMaximums(req.user.userId);
            if (maxDevices && maxDevices > maximums.maximum_devices_per_key) {
                return res.status(403).json({
                    error: "QuotaExceeded",
                    message: `Requested devices per key (${maxDevices}) exceeds your plan limit of ${maximums.maximum_devices_per_key}.`
                });
            }
        } catch (quotaError) {
            return res.status(403).json({ error: "QuotaExceeded", message: quotaError.message });
        }

        const keys = await keysService.generateKeys({
            scriptId,
            ownerId: req.user.userId,
            type,
            maxDevices: maxDevices || 1,
            expiresInDays: type === "timed" ? expiresInDays : null,
            note,
            quantity: requestedQuantity,
        });

        logger.info(`User ${req.user.userId} generated ${keys.length} keys for script ${scriptId}`);

        res.status(201).json({
            success: true,
            data: keys,
            message: `${keys.length} key(s) generated successfully`,
        });
    } catch (error) {
        logger.error("Generate keys error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to generate keys" });
    }
};

/**
 * Get user's keys (paginated)
 * GET /api/keys/me
 */
export const getMyKeys = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, scriptId, search } = req.query;

        const result = await keysService.getMyKeys(req.user.userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            status,
            scriptId,
            search,
        });

        res.json({ success: true, data: result });
    } catch (error) {
        logger.error("Get keys error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch keys" });
    }
};

/**
 * Get key analytics
 * GET /api/keys/stats
 */
export const getKeyStats = async (req, res) => {
    try {
        const stats = await keysService.getKeyStats(req.user.userId);
        res.json({ success: true, data: stats });
    } catch (error) {
        logger.error("Get key stats error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch key stats" });
    }
};

/**
 * Get a single key with devices
 * GET /api/keys/:id
 */
export const getKeyById = async (req, res) => {
    try {
        const key = await keysService.getKeyById(req.params.id);
        if (!key) {
            return res.status(404).json({ error: "NotFound", message: "Key not found" });
        }
        // Verify ownership
        if (key.owner_id !== req.user.userId) {
            return res.status(403).json({ error: "Forbidden", message: "Not authorized" });
        }
        res.json({ success: true, data: key });
    } catch (error) {
        logger.error("Get key error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch key" });
    }
};

/**
 * Revoke a key
 * PATCH /api/keys/:id/revoke
 */
export const revokeKey = async (req, res) => {
    try {
        const key = await keysService.revokeKey(req.params.id, req.user.userId);
        if (!key) {
            return res.status(404).json({ error: "NotFound", message: "Key not found or not authorized" });
        }
        res.json({ success: true, data: key, message: "Key revoked successfully" });
    } catch (error) {
        logger.error("Revoke key error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to revoke key" });
    }
};

/**
 * Delete a key
 * DELETE /api/keys/:id
 */
export const deleteKey = async (req, res) => {
    try {
        const deleted = await keysService.deleteKey(req.params.id, req.user.userId);
        if (!deleted) {
            return res.status(404).json({ error: "NotFound", message: "Key not found or not authorized" });
        }
        res.json({ success: true, message: "Key deleted successfully" });
    } catch (error) {
        logger.error("Delete key error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to delete key" });
    }
};

/**
 * Bulk Revoke keys
 * PATCH /api/keys/bulk-revoke
 */
export const bulkRevokeKeys = async (req, res) => {
    try {
        const { keyIds } = req.body;
        if (!Array.isArray(keyIds) || keyIds.length === 0) {
            return res.status(400).json({ error: "ValidationError", message: "keyIds array is required" });
        }

        const count = await keysService.bulkRevokeKeys(keyIds, req.user.userId);
        res.json({ success: true, message: `${count} key(s) revoked successfully` });
    } catch (error) {
        logger.error("Bulk revoke keys error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to revoke keys" });
    }
};

/**
 * Bulk Delete keys
 * DELETE /api/keys/bulk-delete
 */
export const bulkDeleteKeys = async (req, res) => {
    try {
        const { keyIds } = req.body;
        if (!Array.isArray(keyIds) || keyIds.length === 0) {
            return res.status(400).json({ error: "ValidationError", message: "keyIds array is required" });
        }

        const count = await keysService.bulkDeleteKeys(keyIds, req.user.userId);
        res.json({ success: true, message: `${count} key(s) deleted successfully` });
    } catch (error) {
        logger.error("Bulk delete keys error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to delete keys" });
    }
};

/**
 * Revoke a device
 * DELETE /api/keys/:id/devices/:deviceId
 */
export const revokeDevice = async (req, res) => {
    try {
        const deleted = await keysService.revokeDevice(req.params.deviceId, req.user.userId);
        if (!deleted) {
            return res.status(404).json({ error: "NotFound", message: "Device not found or not authorized" });
        }
        res.json({ success: true, message: "Device revoked successfully" });
    } catch (error) {
        logger.error("Revoke device error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to revoke device" });
    }
};

/**
 * Reset HWID (remove all devices)
 * POST /api/keys/:id/reset-hwid
 */
export const resetHwid = async (req, res) => {
    try {
        await keysService.resetHwid(req.params.id, req.user.userId);
        res.json({ success: true, message: "HWID reset successfully (all devices unlinked)" });
    } catch (error) {
        logger.error("Reset HWID error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to reset HWID" });
    }
};

/**
 * Get security settings
 * GET /api/keys/settings
 */
export const getSettings = async (req, res) => {
    try {
        const settings = await keysService.getSettings(req.user.userId);
        res.json({ success: true, data: settings });
    } catch (error) {
        logger.error("Get settings error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch settings" });
    }
};

/**
 * Update security settings
 * PUT /api/keys/settings
 */
export const updateSettings = async (req, res) => {
    try {
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
        } = req.body;

        // Validate constraints
        if (keyDurationHours !== undefined && keyDurationHours > 6) {
            return res.status(400).json({ error: "BadRequest", message: "Key duration cannot exceed 6 hours" });
        }
        if (adLinks !== undefined && adLinks.length > 5) {
            return res.status(400).json({ error: "BadRequest", message: "Maximum 5 ad links allowed" });
        }
        if (checkpointTimerSeconds !== undefined && (checkpointTimerSeconds < 5 || checkpointTimerSeconds > 60)) {
            return res.status(400).json({ error: "BadRequest", message: "Checkpoint timer must be between 5 and 60 seconds" });
        }
        if (maxKeysPerIp !== undefined && maxKeysPerIp !== 1) {
            return res.status(400).json({ error: "BadRequest", message: "Max keys per IP is fixed at 1" });
        }

        const settings = await keysService.updateSettings(req.user.userId, {
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
        });

        res.json({ success: true, data: settings, message: "Settings updated" });
    } catch (error) {
        logger.error("Update settings error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to update settings" });
    }
};

/**
 * Get user's scripts for generate modal dropdown
 * GET /api/keys/scripts
 */
export const getUserScripts = async (req, res) => {
    try {
        const scripts = await keysService.getUserScripts(req.user.userId);
        res.json({ success: true, data: scripts });
    } catch (error) {
        logger.error("Get user scripts error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch scripts" });
    }
};

/**
 * Get public script info for landing page
 * GET /api/keys/public/script/:slug
 */
export const getPublicScriptInfo = async (req, res) => {
    try {
        const { slug } = req.params;
        const info = await keysService.getPublicScriptInfo(slug);

        if (!info) {
            return res.status(404).json({ success: false, message: "Script not found" });
        }

        res.json({ success: true, data: info });
    } catch (error) {
        logger.error("Get public script info error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch script info" });
    }
};
