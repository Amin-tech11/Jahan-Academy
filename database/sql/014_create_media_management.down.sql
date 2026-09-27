DELETE FROM role_permissions
WHERE permission_id IN (SELECT id FROM permissions WHERE code IN ('media.read', 'media.write'));
DELETE FROM permissions WHERE code IN ('media.read', 'media.write');

DROP INDEX IF EXISTS ix_media_assets_expired_uploads;
DROP INDEX IF EXISTS ix_media_assets_admin_list;
DROP INDEX IF EXISTS uq_media_assets_ready_checksum;

ALTER TABLE media_assets
    DROP CONSTRAINT IF EXISTS ck_media_assets_dimensions,
    DROP CONSTRAINT IF EXISTS ck_media_assets_upload_status,
    DROP CONSTRAINT IF EXISTS ck_media_assets_purpose,
    DROP COLUMN IF EXISTS row_version,
    DROP COLUMN IF EXISTS updated_at,
    DROP COLUMN IF EXISTS confirmed_at,
    DROP COLUMN IF EXISTS upload_expires_at,
    DROP COLUMN IF EXISTS validation_error_code,
    DROP COLUMN IF EXISTS upload_status,
    DROP COLUMN IF EXISTS purpose;

UPDATE media_assets
SET checksum_sha256 = repeat(md5(id::text || object_key), 2)
WHERE checksum_sha256 IS NULL;

ALTER TABLE media_assets ALTER COLUMN checksum_sha256 SET NOT NULL;
ALTER TABLE media_assets ADD CONSTRAINT media_assets_checksum_sha256_privacy_class_key
    UNIQUE (checksum_sha256, privacy_class);
