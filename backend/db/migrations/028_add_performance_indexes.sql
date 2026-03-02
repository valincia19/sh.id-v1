-- ============================================================================
-- Migration 028: Performance Indexes for High-Traffic Scaling
-- ============================================================================
-- Adds composite and partial indexes to optimize the most frequently-hit
-- query patterns. Designed for 10M+ license_keys, millions of script_views,
-- heavy comment/like activity, and concurrent key validation via OpenAPI.
--
-- All indexes use IF NOT EXISTS so this migration is safe to re-run.
-- ============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  1. LICENSE KEYS — most critical table for scale                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Studio key listing: WHERE owner_id = $1 ORDER BY created_at DESC
-- Also used for: COUNT(*) WHERE owner_id = $1 AND status IN (...)
CREATE INDEX IF NOT EXISTS idx_license_keys_owner_created
    ON license_keys (owner_id, created_at DESC);

-- Key count per owner by status (plans.service.js quota checks)
CREATE INDEX IF NOT EXISTS idx_license_keys_owner_status
    ON license_keys (owner_id, status);

-- Filter keys by owner + script (keys.service.js listing with script filter)
CREATE INDEX IF NOT EXISTS idx_license_keys_owner_script_status
    ON license_keys (owner_id, script_id, status);

-- Expiry auto-cleanup: WHERE expires_at < NOW() AND status IN ('active','unused')
CREATE INDEX IF NOT EXISTS idx_license_keys_expires_active
    ON license_keys (expires_at)
    WHERE status IN ('active', 'unused') AND expires_at IS NOT NULL;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  2. SCRIPTS — public listing is the highest-traffic page               ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Browse/search: WHERE status = 'published' AND deleted_at IS NULL ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_scripts_published
    ON scripts (created_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;

-- Trending/popular: WHERE status = 'published' AND deleted_at IS NULL ORDER BY (views + likes * 3) DESC
CREATE INDEX IF NOT EXISTS idx_scripts_popularity
    ON scripts ((views + likes * 3) DESC, created_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;

-- My scripts (studio): WHERE owner_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_scripts_owner_active
    ON scripts (owner_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- Hub scripts: WHERE hub_id = $1 AND status = 'published' AND deleted_at IS NULL
CREATE INDEX IF NOT EXISTS idx_scripts_hub_published
    ON scripts (hub_id, created_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;

-- Game scripts: WHERE game_id = $1 AND status = 'published' AND deleted_at IS NULL
CREATE INDEX IF NOT EXISTS idx_scripts_game_published
    ON scripts (game_id, created_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;

-- Slug lookup (already indexed but make it partial for active scripts)
CREATE UNIQUE INDEX IF NOT EXISTS idx_scripts_slug_unique
    ON scripts (slug)
    WHERE deleted_at IS NULL;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  3. SCRIPT_LIKES — checked on every script page view                   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Like check: WHERE script_id = $1 AND user_id = $2  (SELECT EXISTS / DELETE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_script_likes_script_user
    ON script_likes (script_id, user_id);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  4. SCRIPT_COMMENTS — nested comments with reply counts                ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Top-level comments: WHERE script_id = $1 AND parent_id IS NULL ORDER BY is_pinned DESC, created_at DESC
CREATE INDEX IF NOT EXISTS idx_script_comments_script_toplevel
    ON script_comments (script_id, is_pinned DESC, created_at DESC)
    WHERE parent_id IS NULL;

-- Replies: WHERE script_id = $1 AND parent_id = $2 ORDER BY created_at ASC
CREATE INDEX IF NOT EXISTS idx_script_comments_replies
    ON script_comments (parent_id, created_at ASC)
    WHERE parent_id IS NOT NULL;

-- Reply count subquery: COUNT(*) WHERE parent_id = c.id
-- Already covered by idx_script_comments_parent_id, but composite is better:
CREATE INDEX IF NOT EXISTS idx_script_comments_count_by_script
    ON script_comments (script_id);
-- (this already exists, so IF NOT EXISTS will skip it)


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  5. SCRIPT_VIEWS — analytics, potentially millions of rows             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Daily view chart: WHERE owner_id = $1 GROUP BY TO_CHAR(viewed_at, 'YYYY-MM-DD')
CREATE INDEX IF NOT EXISTS idx_script_views_script_date
    ON script_views (script_id, viewed_at DESC);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  6. DEPLOYMENTS — looked up by user, s3_key, and deploy_key            ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- My deployments: WHERE user_id = $1 ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_deployments_user_created
    ON deployments (user_id, created_at DESC);

-- CDN cross-reference: WHERE s3_key IN (...)
CREATE INDEX IF NOT EXISTS idx_deployments_s3_key
    ON deployments (s3_key);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  7. USERS — auth lookups are on every single request                   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- API key auth (OpenAPI): WHERE api_key = $1
CREATE INDEX IF NOT EXISTS idx_users_api_key
    ON users (api_key)
    WHERE api_key IS NOT NULL;

-- Username + account_status lookup (profile pages, auth)
CREATE INDEX IF NOT EXISTS idx_users_username_active
    ON users (username)
    WHERE account_status = 'active';


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  8. KEY_SETTINGS — looked up by user_id on every getkey page           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE UNIQUE INDEX IF NOT EXISTS idx_key_settings_user_id
    ON key_settings (user_id);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  9. MONETIZATION_SESSIONS — high volume during ad-gate flows           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Session check: WHERE ip_hash = $1 AND script_slug = $2 AND used = false
CREATE INDEX IF NOT EXISTS idx_monetization_sessions_ip_slug_unused
    ON monetization_sessions (ip_hash, script_slug)
    WHERE used = false;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  10. HUBS — public listing and owner lookups                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Active hubs listing sorted by official/verified: WHERE status = 'active'
CREATE INDEX IF NOT EXISTS idx_hubs_active_listing
    ON hubs (is_official DESC, is_verified DESC, created_at DESC)
    WHERE status = 'active';

-- My hubs: WHERE owner_id = $1 ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_hubs_owner_created
    ON hubs (owner_id, created_at DESC);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  11. SCRIPT_TAGS — JOIN-heavy, used in every browse query              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE UNIQUE INDEX IF NOT EXISTS idx_script_tags_unique
    ON script_tags (script_id, tag_id);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  12. SESSIONS — auth middleware checks on every request                ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Session lookup by user + validity
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires
    ON sessions (user_id, expires_at DESC);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  13. USER_ROLES — checked on every authenticated request (RBAC)        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique
    ON user_roles (user_id, role_id);


-- Record migration
INSERT INTO migrations (name) VALUES ('028_add_performance_indexes')
ON CONFLICT DO NOTHING;
