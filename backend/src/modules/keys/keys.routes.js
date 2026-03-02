import express from "express";
import * as keysController from "./keys.controller.js";
import * as monetizationController from "./monetization.controller.js";
import { authenticate } from "../../middleware/auth.js";
import {
    sessionStartLimiter,
    callbackLimiter,
    officialGatewayLimiter,
} from "../../middleware/monetizationRateLimiter.js";

const router = express.Router();

// ── Public routes ─────────────────────────────────────────────────────────────

// Get public script info for landing page
router.get("/public/script/:slug", keysController.getPublicScriptInfo);

// Monetization session management
router.post("/public/start-session", sessionStartLimiter, monetizationController.startSession);

// Provider callbacks
router.get("/public/callback/workink", callbackLimiter, monetizationController.callbackWorkink);
router.get("/public/callback/linkvertise", callbackLimiter, monetizationController.callbackLinkvertise);
router.post("/public/callback/official", officialGatewayLimiter, monetizationController.callbackOfficial);

// Official Gateway multi-checkpoint flow
router.post("/public/official/advance", officialGatewayLimiter, monetizationController.officialAdvance);
router.post("/public/official/verify-captcha", officialGatewayLimiter, monetizationController.officialVerifyCaptcha);
router.post("/public/official/complete", officialGatewayLimiter, monetizationController.officialComplete);
router.get("/public/official/status", officialGatewayLimiter, monetizationController.officialStatus);

// ── Authenticated routes ─────────────────────────────────────────────────────
router.use(authenticate);

// Get user's scripts for generate modal
router.get("/scripts", keysController.getUserScripts);

// Get key analytics
router.get("/stats", keysController.getKeyStats);

// Get security settings
router.get("/settings", keysController.getSettings);

// Update security settings
router.put("/settings", keysController.updateSettings);



// Get user's keys (paginated)
router.get("/me", keysController.getMyKeys);

// Generate new keys
router.post(
    "/generate",
    keysController.generateKeysValidation,
    keysController.generateKeys
);

// Bulk Revoke keys
router.patch("/bulk-revoke", keysController.bulkRevokeKeys);

// Bulk Delete keys
router.delete("/bulk-delete", keysController.bulkDeleteKeys);

// Get single key with devices
router.get("/:id", keysController.getKeyById);

// Revoke a key
router.patch("/:id/revoke", keysController.revokeKey);

// Delete a key
router.delete("/:id", keysController.deleteKey);

// Revoke a device from a key
router.delete("/:id/devices/:deviceId", keysController.revokeDevice);

// Reset HWID (remove all devices)
router.post("/:id/reset-hwid", keysController.resetHwid);

export default router;
