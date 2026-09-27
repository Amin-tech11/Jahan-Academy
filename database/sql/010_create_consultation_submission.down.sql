DROP TABLE IF EXISTS lead_submission_events;
DROP INDEX IF EXISTS ix_leads_deduplication_window;
ALTER TABLE leads
    DROP COLUMN IF EXISTS last_duplicate_at,
    DROP COLUMN IF EXISTS duplicate_count,
    DROP COLUMN IF EXISTS gender_self_description,
    DROP COLUMN IF EXISTS deduplication_key;
