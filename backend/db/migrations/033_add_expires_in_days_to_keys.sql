-- Add expires_in_days to store the duration for timed keys before first activation
ALTER TABLE license_keys ADD COLUMN IF NOT EXISTS expires_in_days INTEGER DEFAULT NULL;
