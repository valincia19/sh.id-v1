import express from "express";
import { initBackupScheduler } from "./modules/backup/backup.service.js";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import passport from "passport";
import config from "./config/index.js";
import { healthCheck as dbHealthCheck, closePool } from "./db/postgres.js";
import { healthCheck as redisHealthCheck, closeRedis } from "./db/redis.js";
import apiRoutes from "./routes/index.js";
import { initializeDiscordStrategy } from "./config/passport/discord.strategy.js";
import { discordBot } from "./modules/discord/discord.bot.js";
import { serveDeployment, challengeDeployment, verifyDeployment } from "./modules/deployments/deployments.controller.js";
import logger, { stream } from "./utils/logger.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import { globalLimiter, writeLimiter } from "./middleware/rateLimiters.js";
import { csrfProtection, getCsrfToken } from "./middleware/csrf.js";
import { cdnLimiter, challengeLimiter } from "./middleware/cdnLimiters.js";

const app = express();

// ============================================
// Proxy Configuration
// ============================================
// Secure proxy trust: trust exactly 1 hop (Nginx).
// CF-Connecting-IP is read directly by getClientIp(), so Express only needs
// to handle the Nginx → Express hop for req.ip to work correctly.
app.set("trust proxy", 1);

// ============================================
// Security Middleware
// ============================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", config.frontendUrl, config.apiUrl, "cdn.jsdelivr.net"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: config.isProduction,
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }),
);

// ============================================
// CORS Configuration
// ============================================
app.use(
  cors({
    origin: config.security.corsOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-Session-Token"],
  }),
);

// ============================================
// Body Parsing Middleware
// ============================================
// Lower limit from 50mb to 5mb to prevent JSON payload parsing from synchronously blocking the Node Event Loop (DoS)
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());
app.use(compression());

// ============================================
// Rate Limiting (imported from middleware/rateLimiters.js)
// ============================================
app.use("/api", globalLimiter);
app.use("/api", writeLimiter);

// ============================================
// Logging Middleware
// ============================================
app.use(morgan(config.isDevelopment ? "dev" : "combined", {
  stream,
  skip: function (req, res) {
    // Skip logging successful requests (2xx, 3xx) in non-development to reduce noise
    return !config.isDevelopment && res.statusCode < 400;
  }
}));

// ============================================
// Passport Initialization
// ============================================
app.use(passport.initialize());

// Initialize OAuth strategies
initializeDiscordStrategy();

// Start Discord Bot (runs silently if token not provided)
discordBot.start();

// ============================================
// Health Check Endpoint
// ============================================
app.get("/health", async (req, res) => {
  try {
    const [dbStatus, redisStatus] = await Promise.all([
      dbHealthCheck(),
      redisHealthCheck(),
    ]);

    const allHealthy =
      dbStatus.status === "connected" && redisStatus.status === "connected";

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      environment: config.env,
      uptime: process.uptime(),
      services: {
        api: "running",
        database: dbStatus,
        redis: redisStatus,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: config.isDevelopment ? error.message : "Internal Server Error",
    });
  }
});

// ============================================
// API Routes
// ============================================
app.get("/", (req, res) => {
  res.json({
    name: "ScriptHub.id API",
    version: "1.0.0",
    status: "running",
    documentation: "/api/docs",
    health: "/health",
  });
});

// ============================================
// API Status Endpoint
// ============================================
app.get("/api/status", (req, res) => {
  res.json({
    status: "operational",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// Swagger API Docs (disabled in production)
// ============================================
if (process.env.NODE_ENV !== 'production') {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ScriptHub.id API Docs',
  }));
  app.get("/docs/json", (req, res) => res.json(swaggerSpec));
}

import scriptsRoutes from "./modules/scripts/scripts.routes.js";

// Alias: Allow /v1/scripts/* to map to the scripts API to support legacy/documented endpoints
app.use("/v1/scripts", scriptsRoutes);

// ============================================
// Public CDN Proxy Route (no auth required, but rate limited)
// ============================================
app.get("/v1/challenge", challengeLimiter, challengeDeployment);
app.get("/v1/verify", challengeLimiter, verifyDeployment);
app.get("/v1/:deployKey", cdnLimiter, serveDeployment);

// ============================================
// CSRF Token Endpoint (must be before CSRF protection)
// ============================================
app.get("/api/csrf-token", getCsrfToken);

// ============================================
// CSRF Protection (applies to all POST/PUT/PATCH/DELETE)
// ============================================
app.use(csrfProtection);

// ============================================
// Mount API Routes
// ============================================
app.use("/api", apiRoutes);

// ============================================
// Global 404 Handler
// ============================================
app.use("*", (req, res) => {
  res.status(404).json({
    error: "NotFound",
    message: "The requested resource was not found on this server.",
  });
});

// ============================================
// Global Error Handler
// ============================================
app.use((err, req, res, next) => {
  // Only log stack traces in development
  if (config.isDevelopment) {
    logger.error("Error: %o", err);
  } else {
    logger.error(`Error: ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  }

  const statusCode = err.statusCode || 500;
  const message =
    config.isProduction && statusCode === 500
      ? "Internal Server Error"
      : err.message || "Something went wrong";

  res.status(statusCode).json({
    error: err.name || "Error",
    message,
    ...(config.isDevelopment && { stack: err.stack }),
  });
});

// ============================================
// Start Server
// ============================================
const PORT = config.port;

app.listen(PORT, () => {
  logger.info("");
  logger.info("🚀 ScriptHub.id Backend API");
  logger.info("================================");
  logger.info(`📡 Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${config.env}`);
  logger.info(`🔗 API URL: ${config.apiUrl}`);
  logger.info(`💚 Health check: ${config.apiUrl}/health`);
  logger.info("================================");
  logger.info("");

  // Initialize daily database backup scheduler only if ENABLE_CRON is explicitly true
  if (process.env.ENABLE_CRON === 'true') {
    initBackupScheduler();
    logger.info("⏰ Cron Backup Scheduler Initialized");
  } else {
    logger.info("⏭️ Cron Scheduler Skipped (ENABLE_CRON !== true)");
  }
});

// ============================================
// Graceful Shutdown
// ============================================
const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Close database connections
    await closePool();
    await closeRedis();

    logger.info("✅ All connections closed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Error during shutdown: %o", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
