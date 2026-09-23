ALTER TABLE faqs
    ADD COLUMN row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
    ADD COLUMN published_at timestamptz,
    ADD COLUMN archived_at timestamptz,
    ADD COLUMN archived_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN archive_reason varchar(500),
    ADD COLUMN deleted_at timestamptz;

ALTER TABLE faq_translations
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE faq_assignments
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE faq_assignments DROP CONSTRAINT faq_assignments_target_type_check;
ALTER TABLE faq_assignments
    ADD CONSTRAINT faq_assignments_target_type_check
    CHECK (target_type IN (
        'general','homepage','page','country','university','program','course','service'
    ));

ALTER TABLE faq_assignments
    DROP CONSTRAINT faq_assignments_faq_id_target_type_target_id_key;
CREATE UNIQUE INDEX uq_faq_assignment_target
    ON faq_assignments (
        faq_id,
        target_type,
        COALESCE(target_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );

CREATE INDEX ix_faqs_admin_list
    ON faqs (status, updated_at DESC, id)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_faq_assignments_public_order
    ON faq_assignments (target_type, target_id, display_order, faq_id);
