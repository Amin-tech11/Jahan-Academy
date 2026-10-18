ALTER TABLE media_assets ADD COLUMN quarantine_key text;
ALTER TABLE media_assets ADD COLUMN quarantine_cleanup_after timestamptz;
ALTER TABLE media_assets ADD COLUMN quarantine_cleaned_at timestamptz;
-- Existing ready rows lost the original path; reconstruct the application's UTC key.
UPDATE media_assets SET quarantine_key = CASE WHEN upload_status = 'ready'
    THEN 'media/' || to_char(created_at AT TIME ZONE 'UTC', 'YYYY/MM') || '/' || regexp_replace(object_key, '^.*/', '')
    ELSE object_key END,
    quarantine_cleanup_after = coalesce(upload_expires_at, created_at + interval '1 hour') + interval '5 minutes'
WHERE purpose IS NOT NULL;
CREATE INDEX ix_media_quarantine_cleanup ON media_assets (quarantine_cleanup_after)
    WHERE quarantine_cleaned_at IS NULL AND quarantine_key IS NOT NULL;
