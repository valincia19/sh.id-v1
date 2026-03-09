-- Drop the old unique constraint that prevents per-day tracking
ALTER TABLE script_views DROP CONSTRAINT IF EXISTS script_views_script_id_ip_address_key;

-- Since viewed_at is TIMESTAMPTZ, casting it to DATE is not immutable (depends on TimeZone).
-- We can add a generated column that is explicitly immutable by using AT TIME ZONE 'UTC', or we can just 
-- use a standard B-tree index on the expressions with an immutable function, but the easiest and most 
-- robust way in Postgres is to create an index on (viewed_at AT TIME ZONE 'UTC')::date.

CREATE INDEX IF NOT EXISTS idx_script_views_daily_unique 
    ON script_views (script_id, ip_address, ((viewed_at AT TIME ZONE 'UTC')::date));
