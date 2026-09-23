DROP INDEX IF EXISTS ix_program_intakes_discovery;
DROP INDEX IF EXISTS ix_programs_public_list;
DROP INDEX IF EXISTS ix_programs_admin_list;
DROP INDEX IF EXISTS uq_program_single_primary_field;

ALTER TABLE programs
    DROP CONSTRAINT IF EXISTS ck_programs_row_version,
    DROP CONSTRAINT IF EXISTS fk_programs_application_fee_currency,
    DROP CONSTRAINT IF EXISTS fk_programs_tuition_currency,
    DROP CONSTRAINT IF EXISTS ck_programs_duration_complete,
    DROP CONSTRAINT IF EXISTS ck_programs_tuition_values_strict,
    DROP CONSTRAINT IF EXISTS ck_programs_application_fee_values,
    DROP CONSTRAINT IF EXISTS ck_programs_application_fee_mode,
    DROP COLUMN IF EXISTS archive_reason,
    DROP COLUMN IF EXISTS archived_by_user_id,
    DROP COLUMN IF EXISTS archived_at,
    DROP COLUMN IF EXISTS published_at,
    DROP COLUMN IF EXISTS row_version,
    DROP COLUMN IF EXISTS application_fee_mode;

