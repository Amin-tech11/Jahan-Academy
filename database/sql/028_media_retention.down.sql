DROP INDEX ix_media_quarantine_cleanup;
ALTER TABLE media_assets DROP COLUMN quarantine_cleaned_at;
ALTER TABLE media_assets DROP COLUMN quarantine_cleanup_after;
ALTER TABLE media_assets DROP COLUMN quarantine_key;
