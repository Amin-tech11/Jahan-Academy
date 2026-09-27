DROP INDEX IF EXISTS ix_faq_assignments_public_order;
DROP INDEX IF EXISTS ix_faqs_admin_list;
DROP INDEX IF EXISTS uq_faq_assignment_target;

UPDATE faq_assignments SET target_type = 'homepage' WHERE target_type = 'general';
ALTER TABLE faq_assignments DROP CONSTRAINT faq_assignments_target_type_check;
ALTER TABLE faq_assignments
    ADD CONSTRAINT faq_assignments_target_type_check
    CHECK (target_type IN ('homepage','page','country','university','program','course','service'));
ALTER TABLE faq_assignments
    ADD CONSTRAINT faq_assignments_faq_id_target_type_target_id_key
    UNIQUE (faq_id, target_type, target_id);

ALTER TABLE faq_assignments
    DROP COLUMN IF EXISTS updated_at,
    DROP COLUMN IF EXISTS created_at;
ALTER TABLE faq_translations
    DROP COLUMN IF EXISTS updated_at,
    DROP COLUMN IF EXISTS created_at;
ALTER TABLE faqs
    DROP COLUMN IF EXISTS deleted_at,
    DROP COLUMN IF EXISTS archive_reason,
    DROP COLUMN IF EXISTS archived_by_user_id,
    DROP COLUMN IF EXISTS archived_at,
    DROP COLUMN IF EXISTS published_at,
    DROP COLUMN IF EXISTS row_version;
