/**
 * Strict Environment Configuration Loader for Frontend
 * Fails fast if critical variables are missing or use dangerous fallbacks in production.
 */

const getEnv = (key: string, isProductionCheck: boolean = false): string => {
    // Note: Next.js requires process.env.NEXT_PUBLIC_ prefixes to be explicitly written out.
    // They are injected at build time.
    let val: string | undefined;

    if (key === 'NEXT_PUBLIC_API_URL') val = process.env.NEXT_PUBLIC_API_URL;
    else if (key === 'NEXT_PUBLIC_API_BASE_URL') val = process.env.NEXT_PUBLIC_API_BASE_URL;
    else if (key === 'NEXT_PUBLIC_CDN_BASE_URL') val = process.env.NEXT_PUBLIC_CDN_BASE_URL;
    else if (key === 'NEXT_PUBLIC_TURNSTILE_SITE_KEY') val = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    else val = process.env[key];

    if (!val) {
        throw new Error(`CRITICAL CONFIGURATION VULNERABILITY: Missing required frontend environment variable: ${key}`);
    }

    if (isProductionCheck && process.env.NODE_ENV === 'production') {
        if (val.includes('localhost') || val.includes('127.0.0.1')) {
            throw new Error(`CRITICAL: Production environment variable ${key} cannot contain localhost.`);
        }
        if (key === 'NEXT_PUBLIC_TURNSTILE_SITE_KEY' && val === '1x00000000000000000000AA') {
            throw new Error(`CRITICAL: Cannot use test Turnstile key in production.`);
        }
    }

    return val;
};

export const envConfig = {
    apiUrl: getEnv('NEXT_PUBLIC_API_URL', true),
    apiBaseUrl: getEnv('NEXT_PUBLIC_API_BASE_URL', true),
    cdnBaseUrl: getEnv('NEXT_PUBLIC_CDN_BASE_URL', true),
    turnstileSiteKey: getEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', true),
    smartlinkUrl: process.env.NEXT_PUBLIC_SMARTLINK_URL || "https://www.effectivegatecpm.com/emir9zu0?key=f4680038fe11c74bdf3ca16d8d2bce63",
} as const;
