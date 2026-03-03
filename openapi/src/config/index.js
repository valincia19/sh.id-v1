/**
 * OpenAPI Configuration
 * 
 * Re-uses the backend's configuration since both services share the same
 * .env file via docker-compose. This eliminates config duplication and
 * ensures both services always use the same credentials.
 * 
 * The backend .env is injected via docker-compose env_file directive.
 */
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================
// Helpers (same as backend)
// ============================================
const validEnvs = ['development', 'production', 'test'];
if (!process.env.NODE_ENV || !validEnvs.includes(process.env.NODE_ENV)) {
  throw new Error("CRITICAL: NODE_ENV must be explicitly set to 'development', 'production', or 'test'. Server refusing to start.");
}

const env = process.env.NODE_ENV;
const isDevelopment = env === 'development';
const isProduction = env === 'production';
const isTest = env === 'test';

const requireEnv = (key, type = 'string') => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`CRITICAL CONFIGURATION VULNERABILITY: Missing required environment variable: ${key}`);
  }
  if (type === 'number') {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`CRITICAL: Environment variable ${key} must be a valid number.`);
    }
    return parsed;
  }
  if (type === 'boolean') return value === 'true';
  return value;
};

const optionalEnv = (key, defaultValue = undefined, type = 'string') => {
  const value = process.env[key];
  if (!value) return defaultValue;
  if (type === 'number') {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) throw new Error(`CRITICAL: Environment variable ${key} must be a valid number.`);
    return parsed;
  }
  if (type === 'boolean') return value === 'true';
  return value;
};

// ============================================
// CORS (same logic as backend)
// ============================================
let corsOrigins = [];
if (isProduction) {
  if (!process.env.CORS_ORIGINS) {
    throw new Error("CRITICAL: CORS_ORIGINS must be defined in production.");
  }
  corsOrigins = process.env.CORS_ORIGINS.split(',').map(o => o.trim());
  if (corsOrigins.some(o => o.includes('localhost') || o.includes('127.0.0.1') || o.includes('getkey.'))) {
    throw new Error("CRITICAL CONFIGURATION VULNERABILITY: Production CORS contains localhost or legacy getkey domains.");
  }
  if (corsOrigins.length === 0 || corsOrigins.includes('*')) {
    throw new Error("CRITICAL CONFIGURATION VULNERABILITY: Production CORS cannot be empty or wildcard (*).");
  }
} else {
  corsOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://getfreekey.localhost:3000'];
}

// ============================================
// Unified Config (mirrors backend/src/config/index.js)
// ============================================
const config = {
  // Environment
  env,
  nodeEnv: env, // alias for backward compat
  isDevelopment,
  isProduction,
  isTest,

  // Server — OpenAPI always runs on 4001
  port: 4001,
  apiUrl: requireEnv('API_URL'),

  // Frontend
  frontendUrl: requireEnv('FRONTEND_URL'),
  appUrl: requireEnv('APP_URL'),
  getkeyUrl: optionalEnv('GETFREEKEY_URL', ''),

  // Database (shared with backend)
  database: {
    host: requireEnv('POSTGRES_HOST'),
    port: requireEnv('POSTGRES_PORT', 'number'),
    database: requireEnv('POSTGRES_DB'),
    user: requireEnv('POSTGRES_USER'),
    password: requireEnv('POSTGRES_PASSWORD'),
    url: optionalEnv('DATABASE_URL'),
    ssl: optionalEnv('POSTGRES_SSL', false, 'boolean') ? { rejectUnauthorized: false } : false,
    max: optionalEnv('DB_POOL_MAX', 8, 'number'),
    idleTimeoutMillis: optionalEnv('DB_IDLE_TIMEOUT', 10000, 'number'),
    connectionTimeoutMillis: optionalEnv('DB_CONN_TIMEOUT', 3000, 'number'),
  },

  // Redis (shared with backend)
  redis: {
    host: requireEnv('REDIS_HOST'),
    port: requireEnv('REDIS_PORT', 'number'),
    password: requireEnv('REDIS_PASSWORD'),
    url: optionalEnv('REDIS_URL'),
    db: 0,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
  },

  // JWT (shared with backend)
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: requireEnv('JWT_EXPIRES_IN'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    refreshExpiresIn: requireEnv('JWT_REFRESH_EXPIRES_IN'),
    issuer: 'scripthub.id',
    audience: 'scripthub.id',
  },

  // OAuth - Discord
  discord: {
    clientId: optionalEnv('DISCORD_CLIENT_ID'),
    clientSecret: optionalEnv('DISCORD_CLIENT_SECRET'),
    callbackUrl: optionalEnv('DISCORD_CALLBACK_URL'),
    scope: ['identify', 'email'],
  },

  // Email
  email: {
    smtp: {
      host: optionalEnv('SMTP_HOST'),
      port: optionalEnv('SMTP_PORT', undefined, 'number'),
      secure: optionalEnv('SMTP_PORT') === '465',
      auth: {
        user: optionalEnv('SMTP_USER'),
        pass: optionalEnv('SMTP_PASSWORD'),
      },
    },
    from: requireEnv('EMAIL_FROM'),
    replyTo: requireEnv('EMAIL_REPLY_TO'),
  },

  // Security (shared with backend)
  security: {
    bcryptRounds: requireEnv('BCRYPT_ROUNDS', 'number'),
    sessionSecret: requireEnv('SESSION_SECRET'),
    corsOrigins,
  },

  // Rate Limiting (shared with backend)
  rateLimit: {
    windowMs: requireEnv('RATE_LIMIT_WINDOW', 'number') * 60 * 1000,
    max: requireEnv('RATE_LIMIT_MAX', 'number'),
    auth: {
      windowMs: requireEnv('RATE_LIMIT_AUTH_WINDOW', 'number') * 60 * 1000,
      max: requireEnv('RATE_LIMIT_AUTH_MAX', 'number'),
    },
    api: {
      windowMs: requireEnv('RATE_LIMIT_API_WINDOW', 'number') * 60 * 1000,
      max: requireEnv('RATE_LIMIT_API_MAX', 'number'),
    },
  },

  // S3 Storage (shared with backend)
  s3: {
    endpoint: requireEnv('S3_ENDPOINT'),
    accessKeyId: requireEnv('S3_ACCESS_KEY'),
    secretAccessKey: requireEnv('S3_SECRET_KEY'),
    bucket: optionalEnv('S3_BUCKET_NAME', ''),
    bucketImages: optionalEnv('S3_BUCKET_IMAGES', ''),
    bucketScripts: optionalEnv('S3_BUCKET_SCRIPTS', ''),
    region: requireEnv('S3_REGION'),
  },

  // File Upload
  upload: {
    maxFileSize: requireEnv('MAX_FILE_SIZE', 'number'),
    uploadDir: requireEnv('UPLOAD_DIR'),
    allowedMimeTypes: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'text/plain', 'application/json',
    ],
  },

  // Logging
  logging: {
    level: isProduction ? 'info' : 'debug',
    dir: requireEnv('LOG_DIR'),
    maxFiles: '14d',
    maxSize: '20m',
  },

  // Feature Flags
  features: {
    emailVerification: optionalEnv('ENABLE_EMAIL_VERIFICATION', false, 'boolean'),
    discordLogin: optionalEnv('ENABLE_DISCORD_LOGIN', false, 'boolean'),
    registration: optionalEnv('ENABLE_REGISTRATION', false, 'boolean'),
  },

  // Session
  session: {
    name: 'scripthub.sid',
    secret: requireEnv('SESSION_SECRET'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: isProduction ? 'strict' : 'lax',
    },
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
};

Object.freeze(config);

export default config;
