ALTER TABLE universities
    ADD COLUMN contact_phone varchar(40),
    ADD COLUMN tuition_mode varchar(20) NOT NULL DEFAULT 'contact',
    ADD COLUMN tuition_min_minor bigint,
    ADD COLUMN tuition_max_minor bigint,
    ADD COLUMN tuition_currency char(3),
    ADD COLUMN row_version integer NOT NULL DEFAULT 1,
    ADD COLUMN published_at timestamptz,
    ADD COLUMN archived_at timestamptz,
    ADD COLUMN archived_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN archive_reason varchar(500),
    ADD CONSTRAINT ck_universities_tuition_mode
        CHECK (tuition_mode IN ('exact','range','contact')),
    ADD CONSTRAINT ck_universities_tuition_values
        CHECK (
            (tuition_mode = 'contact' AND tuition_min_minor IS NULL AND tuition_max_minor IS NULL AND tuition_currency IS NULL)
            OR (tuition_mode = 'exact' AND tuition_min_minor IS NOT NULL AND tuition_min_minor >= 0 AND tuition_max_minor IS NULL AND tuition_currency IS NOT NULL)
            OR (tuition_mode = 'range' AND tuition_min_minor IS NOT NULL AND tuition_min_minor >= 0 AND tuition_max_minor IS NOT NULL AND tuition_max_minor >= tuition_min_minor AND tuition_currency IS NOT NULL)
        ),
    ADD CONSTRAINT fk_universities_tuition_currency
        FOREIGN KEY (tuition_currency) REFERENCES currencies(code) ON DELETE RESTRICT,
    ADD CONSTRAINT ck_universities_row_version CHECK (row_version > 0);

CREATE INDEX ix_universities_admin_list
    ON universities(status, updated_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_universities_public_list
    ON universities(featured DESC, created_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;
CREATE UNIQUE INDEX uq_university_single_logo
    ON university_media(university_id)
    WHERE media_role = 'logo';
CREATE UNIQUE INDEX uq_university_single_hero
    ON university_media(university_id)
    WHERE media_role = 'hero';

INSERT INTO permissions (code, description) VALUES
    ('catalog.read', 'View university catalog records including drafts and archives'),
    ('catalog.write', 'Create, edit, publish, archive, and delete university catalog records')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code IN ('super_admin', 'content_editor')
  AND permissions.code IN ('catalog.read', 'catalog.write')
ON CONFLICT DO NOTHING;

