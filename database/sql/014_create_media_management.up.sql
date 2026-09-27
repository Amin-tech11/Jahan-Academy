ALTER TABLE media_assets
    ALTER COLUMN checksum_sha256 DROP NOT NULL,
    ADD COLUMN purpose varchar(32),
    ADD COLUMN upload_status varchar(24) NOT NULL DEFAULT 'ready',
    ADD COLUMN validation_error_code varchar(80),
    ADD COLUMN upload_expires_at timestamptz,
    ADD COLUMN confirmed_at timestamptz,
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN row_version integer NOT NULL DEFAULT 1,
    ADD CONSTRAINT ck_media_assets_purpose CHECK (
        purpose IS NULL OR purpose IN ('logo','university_image','article_image','public_file')
    ),
    ADD CONSTRAINT ck_media_assets_upload_status CHECK (
        upload_status IN ('pending','processing','ready','rejected')
    ),
    ADD CONSTRAINT ck_media_assets_dimensions CHECK (
        (width IS NULL AND height IS NULL) OR (width > 0 AND height > 0)
    );

ALTER TABLE media_assets
    DROP CONSTRAINT IF EXISTS media_assets_checksum_sha256_privacy_class_key;

CREATE UNIQUE INDEX uq_media_assets_ready_checksum
    ON media_assets(checksum_sha256)
    WHERE upload_status = 'ready' AND deleted_at IS NULL AND checksum_sha256 IS NOT NULL;
CREATE INDEX ix_media_assets_admin_list
    ON media_assets(upload_status, purpose, created_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_media_assets_expired_uploads
    ON media_assets(upload_expires_at)
    WHERE upload_status IN ('pending','processing') AND deleted_at IS NULL;

INSERT INTO permissions (code, description) VALUES
    ('media.read', 'View and search media assets'),
    ('media.write', 'Upload, edit, validate, and delete media assets')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code IN ('super_admin', 'content_editor')
  AND permissions.code IN ('media.read', 'media.write')
ON CONFLICT DO NOTHING;
