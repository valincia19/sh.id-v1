-- Migration 034: Add script_s3_key column for 3-layer obfuscation architecture
-- For obfuscated deployments:
--   s3_key       → points to the LOADER file on CDN (visible in /studio/deployments)
--   script_s3_key → points to the user's REAL script (RC4 encrypted, hidden in script/{username}/)
-- For regular deployments: script_s3_key remains NULL.

ALTER TABLE deployments
ADD COLUMN IF NOT EXISTS script_s3_key VARCHAR(512) DEFAULT NULL;

COMMENT ON COLUMN deployments.script_s3_key IS 'S3 key for the encrypted raw script (used in obfuscated deployments only)';
