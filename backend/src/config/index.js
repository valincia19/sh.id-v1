import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// 1. Enforce NODE_ENV explicitly
const validEnvs = ['development', 'production', 'test'];
if (!process.env.NODE_ENV || !validEnvs.includes(process.env.NODE_ENV)) {
  throw new Error("CRITICAL: NODE_ENV must be explicitly set to 'development', 'production', or 'test'. Server refusing to start.");
}

const env = process.env.NODE_ENV;
const isDevelopment = env === 'development';
const isProduction = env === 'production';
const isTest = env === 'test';

// 2. Fail-Fast Helper
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

// 3. CORS Split (Strict Separation)
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

const config = {
  // Environment
  env,
  isDevelopment,
  isProduction,
  isTest,

  // Server
  port: requireEnv('API_PORT', 'number'),
  apiUrl: requireEnv('API_URL'),

  // Frontend
  frontendUrl: requireEnv('FRONTEND_URL'),
  appUrl: requireEnv('APP_URL'),
  getkeyUrl: requireEnv('GETFREEKEY_URL'),

  // Database
  database: {
    host: requireEnv('POSTGRES_HOST'),
    port: requireEnv('POSTGRES_PORT', 'number'),
    database: requireEnv('POSTGRES_DB'),
    user: requireEnv('POSTGRES_USER'),
    password: requireEnv('POSTGRES_PASSWORD'),
    url: optionalEnv('DATABASE_URL'),
    ssl: optionalEnv('POSTGRES_SSL', false, 'boolean') ? { rejectUnauthorized: false } : false,
    max: optionalEnv('DB_POOL_MAX', 10, 'number'),
    idleTimeoutMillis: optionalEnv('DB_IDLE_TIMEOUT', 10000, 'number'),
    connectionTimeoutMillis: optionalEnv('DB_CONN_TIMEOUT', 3000, 'number'),
  },

  // Redis
  redis: {
    host: requireEnv('REDIS_HOST'),
    port: requireEnv('REDIS_PORT', 'number'),
    password: requireEnv('REDIS_PASSWORD'), // Strict: must have password in all environments
    url: optionalEnv('REDIS_URL'),
    db: 0,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
  },

  // JWT
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
    botToken: optionalEnv('DISCORD_BOT_TOKEN'),
    guildId: optionalEnv('DISCORD_GUILD_ID'),
    scope: ['identify', 'email', 'guilds.join'],
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

  // Security
  security: {
    bcryptRounds: requireEnv('BCRYPT_ROUNDS', 'number'),
    sessionSecret: requireEnv('SESSION_SECRET'),
    corsOrigins,
  },

  // Rate Limiting
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

  // S3 Storage
  s3: {
    endpoint: requireEnv('S3_ENDPOINT'),
    accessKeyId: requireEnv('S3_ACCESS_KEY'),
    secretAccessKey: requireEnv('S3_SECRET_KEY'),
    bucketImages: requireEnv('S3_BUCKET_IMAGES'),
    bucketScripts: requireEnv('S3_BUCKET_SCRIPTS'),
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

  // Monetization Key System
  monetization: {
    secret: requireEnv('MONETIZATION_SECRET'),
    workinkUrl: optionalEnv('MONETIZATION_WORKINK_URL', ''),
    linkvertiseUrl: optionalEnv('MONETIZATION_LINKVERTISE_URL', ''),
    turnstileSecret: requireEnv('TURNSTILE_SECRET_KEY'),
    platformAdLink: optionalEnv('PLATFORM_AD_LINK', ''),
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
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? 'strict' : 'lax',
    },
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
};

// Deep freeze to prevent runtime modifications of config
Object.freeze(config);

export default config;
