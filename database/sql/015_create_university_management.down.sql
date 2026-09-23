DELETE FROM role_permissions
WHERE permission_id IN (SELECT id FROM permissions WHERE code IN ('catalog.read', 'catalog.write'));
DELETE FROM permissions WHERE code IN ('catalog.read', 'catalog.write');

DROP INDEX IF EXISTS uq_university_single_hero;
DROP INDEX IF EXISTS uq_university_single_logo;
DROP INDEX IF EXISTS ix_universities_public_list;
DROP INDEX IF EXISTS ix_universities_admin_list;

ALTER TABLE universities
    DROP CONSTRAINT IF EXISTS ck_universities_row_version,
    DROP CONSTRAINT IF EXISTS fk_universities_tuition_currency,
    DROP CONSTRAINT IF EXISTS ck_universities_tuition_values,
    DROP CONSTRAINT IF EXISTS ck_universities_tuition_mode,
    DROP COLUMN IF EXISTS archive_reason,
    DROP COLUMN IF EXISTS archived_by_user_id,
    DROP COLUMN IF EXISTS archived_at,
    DROP COLUMN IF EXISTS published_at,
    DROP COLUMN IF EXISTS row_version,
    DROP COLUMN IF EXISTS tuition_currency,
    DROP COLUMN IF EXISTS tuition_max_minor,
    DROP COLUMN IF EXISTS tuition_min_minor,
    DROP COLUMN IF EXISTS tuition_mode,
    DROP COLUMN IF EXISTS contact_phone;

