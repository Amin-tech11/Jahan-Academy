ALTER TABLE programs
    ADD COLUMN application_fee_mode varchar(20) NOT NULL DEFAULT 'contact',
    ADD COLUMN row_version integer NOT NULL DEFAULT 1,
    ADD COLUMN published_at timestamptz,
    ADD COLUMN archived_at timestamptz,
    ADD COLUMN archived_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN archive_reason varchar(500),
    ADD CONSTRAINT ck_programs_application_fee_mode
        CHECK (application_fee_mode IN ('exact','free','contact')),
    ADD CONSTRAINT ck_programs_application_fee_values
        CHECK (
            (application_fee_mode = 'contact' AND application_fee_minor IS NULL AND application_fee_currency IS NULL)
            OR (application_fee_mode = 'free' AND application_fee_minor = 0 AND application_fee_currency IS NULL)
            OR (application_fee_mode = 'exact' AND application_fee_minor IS NOT NULL AND application_fee_minor >= 0 AND application_fee_currency IS NOT NULL)
        ),
    ADD CONSTRAINT ck_programs_tuition_values_strict
        CHECK (
            (tuition_mode = 'contact' AND tuition_min_minor IS NULL AND tuition_max_minor IS NULL AND tuition_currency IS NULL)
            OR (tuition_mode = 'exact' AND tuition_min_minor IS NOT NULL AND tuition_min_minor >= 0 AND tuition_max_minor IS NULL AND tuition_currency IS NOT NULL)
            OR (tuition_mode = 'range' AND tuition_min_minor IS NOT NULL AND tuition_min_minor >= 0 AND tuition_max_minor IS NOT NULL AND tuition_max_minor >= tuition_min_minor AND tuition_currency IS NOT NULL)
        ),
    ADD CONSTRAINT ck_programs_duration_complete
        CHECK ((duration_value IS NULL AND duration_unit IS NULL) OR (duration_value > 0 AND duration_unit IS NOT NULL)),
    ADD CONSTRAINT fk_programs_tuition_currency
        FOREIGN KEY (tuition_currency) REFERENCES currencies(code) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_programs_application_fee_currency
        FOREIGN KEY (application_fee_currency) REFERENCES currencies(code) ON DELETE RESTRICT,
    ADD CONSTRAINT ck_programs_row_version CHECK (row_version > 0);

CREATE UNIQUE INDEX uq_program_single_primary_field
    ON program_fields(program_id)
    WHERE is_primary;
CREATE INDEX ix_programs_admin_list
    ON programs(status, updated_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_programs_public_list
    ON programs(featured DESC, created_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX ix_program_intakes_discovery
    ON program_intakes(intake_id, intake_year, application_deadline, status);

