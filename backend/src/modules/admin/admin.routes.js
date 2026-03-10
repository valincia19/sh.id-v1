import { Router } from "express";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../../db/redis.js";
import { authenticate } from "../../middleware/auth.js";
import { checkPermission } from "../../middleware/rbac.js";
import * as adminController from "./admin.controller.js";
import * as adminLoaderController from "./admin.loaders.controller.js";
import { getLockedAccounts, unlockAccount, getLockoutStatus } from "../../middleware/lockout.js";
import config from "../../config/index.js";
import logger from "../../utils/logger.js";

const router = Router();

// ============================================
// Admin Rate Limiter
// ============================================
const adminLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: "rl:admin:",
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.isDevelopment ? 1000 : 200, // Strict limit for admin actions
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`[RATE_LIMIT] Admin operations limit hit | IP: ${req.ip} | User: ${req.user?.userId || 'unknown'}`);
        res.status(429).json({
            error: "TooManyRequests",
            message: "Too many administrative actions requested. Please wait before trying again.",
        });
    }
});

// All admin routes require authentication, admin.access permission, and rate limiting
router.use(authenticate, checkPermission('admin.access'), adminLimiter);

router.get("/stats", adminController.getStats);
router.get("/users", checkPermission('users.read'), adminController.getUsers);
router.patch("/users/:id", checkPermission('users.update'), adminController.updateUser);
router.patch("/users/:id/status", checkPermission('users.ban'), adminController.setUserStatus);
router.patch("/users/:id/roles", checkPermission('users.update'), adminController.setUserRoles);

router.get("/scripts", checkPermission('scripts.read'), adminController.getScripts);
router.delete("/scripts/:id", checkPermission('scripts.moderate'), adminController.deleteScript);
router.patch("/scripts/:id/status", checkPermission('scripts.moderate'), adminController.updateScriptStatus);
router.patch("/scripts/:id/restore", checkPermission('scripts.moderate'), adminController.restoreScript);

router.get("/deployments", adminController.getDeployments);
router.delete("/deployments/:id", adminController.deleteDeployment);

router.get("/keys", adminController.getKeys);
router.delete("/keys/expired", adminController.deleteExpiredKeys);
router.delete("/keys/:id", adminController.deleteKey);

router.get("/hubs", checkPermission('hubs.read'), adminController.getHubs);
router.patch("/hubs/:id", checkPermission('hubs.update'), adminController.updateHub);
router.delete("/hubs/:id", checkPermission('hubs.delete'), adminController.deleteHub);
router.patch("/hubs/:id/status", checkPermission('hubs.update'), adminController.updateHubStatus);
router.patch("/hubs/:id/owner", checkPermission('hubs.update'), adminController.changeHubOwner);

router.get("/executors", adminController.getExecutors);
router.delete("/executors/:id", adminController.deleteExecutor);
router.patch("/executors/:id/status", adminController.updateExecutorStatus);
router.patch("/executors/:id/owner", adminController.changeExecutorOwner);
router.patch("/executors/:id/restore", adminController.restoreExecutor);

router.get("/plans", adminController.getPlans);
router.patch("/plans/:id", adminController.updatePlan);

// ============================================
// Settings / Stub Management
// ============================================
router.get("/settings/stub", adminController.getStubObfuscated);
router.put("/settings/stub", adminController.updateStubObfuscated);
router.get("/settings/stub/raw", adminController.getStubRaw);
router.put("/settings/stub/raw", adminController.updateStubRaw);

// ============================================
// Loader Management
// ============================================
router.get("/loaders", checkPermission('admin.access'), adminLoaderController.getLoaders);
router.get("/loaders/:filename", checkPermission('admin.access'), adminLoaderController.getLoaderContent);
router.put("/loaders/:filename", checkPermission('admin.access'), adminLoaderController.upsertLoader);
router.delete("/loaders/:filename", checkPermission('admin.access'), adminLoaderController.deleteLoader);

// ============================================
// Account Lockout Management
// ============================================
router.get("/lockouts", getLockedAccounts);
router.get("/lockouts/:identifier", async (req, res) => {
    try {
        const status = await getLockoutStatus(req.params.identifier);
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ error: "ServerError", message: "Failed to get lockout status" });
    }
});
router.delete("/lockouts/:identifier", async (req, res) => {
    try {
        const success = await unlockAccount(req.params.identifier);
        if (success) {
            res.json({ success: true, message: `Account ${req.params.identifier} unlocked successfully` });
        } else {
            res.status(500).json({ error: "ServerError", message: "Failed to unlock account" });
        }
    } catch (error) {
        res.status(500).json({ error: "ServerError", message: "Failed to unlock account" });
    }
});
// ============================================
// CDN Management
// ============================================
import * as adminCdnController from "./admin.cdn.js";

router.get("/cdn/files", adminCdnController.getCDNFiles);
router.get("/cdn/stats", adminCdnController.getCDNStats);
router.get("/cdn/preview", adminCdnController.getPreviewUrl);
router.get("/cdn/content", adminCdnController.getFileContent);
router.delete("/cdn/files", adminCdnController.deleteCDNFile);

export default router;
