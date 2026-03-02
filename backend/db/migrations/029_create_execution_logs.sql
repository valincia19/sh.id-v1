-- =========================================================================
-- MIGRATION: 029_create_execution_logs
-- TIMESTAMP: 2026-03-02 09:35:00
-- DESCRIPTION: Creates the execution_logs table to store telemetry data when
--              a user executes a script via a license key, capturing Roblox
--              Username, Roblox User ID, and Executor Name.
-- =========================================================================

BEGIN;

DROP TABLE IF EXISTS execution_logs CASCADE;

CREATE TABLE IF NOT EXISTS execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id UUID REFERENCES license_keys(id) ON DELETE SET NULL,
    hwid VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    executor_name VARCHAR(255),
    roblox_username VARCHAR(255),
    roblox_user_id BIGINT,
    is_success BOOLEAN DEFAULT false,
    failure_reason VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for analytics querying
CREATE INDEX IF NOT EXISTS idx_execution_logs_key_id ON execution_logs(key_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_created_at ON execution_logs(created_at);

COMMIT;
