DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE code IN ('reference_data.read', 'reference_data.write')
);
DELETE FROM permissions WHERE code IN ('reference_data.read', 'reference_data.write');

DROP INDEX IF EXISTS ix_currencies_reference_list;
DROP INDEX IF EXISTS ix_intakes_reference_list;
DROP INDEX IF EXISTS ix_fields_of_study_reference_list;
DROP INDEX IF EXISTS ix_academic_levels_reference_list;
DROP INDEX IF EXISTS ix_cities_reference_list;
DROP TABLE IF EXISTS currency_translations, currencies, intake_translations;

ALTER TABLE intakes DROP COLUMN IF EXISTS updated_at, DROP COLUMN IF EXISTS created_at, DROP COLUMN IF EXISTS row_version, DROP COLUMN IF EXISTS active;
ALTER TABLE field_of_study_translations DROP COLUMN IF EXISTS updated_at, DROP COLUMN IF EXISTS created_at;
ALTER TABLE fields_of_study DROP COLUMN IF EXISTS updated_at, DROP COLUMN IF EXISTS created_at, DROP COLUMN IF EXISTS row_version;
ALTER TABLE academic_level_translations DROP COLUMN IF EXISTS updated_at, DROP COLUMN IF EXISTS created_at;
ALTER TABLE academic_levels DROP COLUMN IF EXISTS updated_at, DROP COLUMN IF EXISTS created_at, DROP COLUMN IF EXISTS row_version;
ALTER TABLE city_translations DROP COLUMN IF EXISTS updated_at, DROP COLUMN IF EXISTS created_at, DROP COLUMN IF EXISTS description;
ALTER TABLE countries DROP COLUMN IF EXISTS row_version;
ALTER TABLE cities DROP COLUMN IF EXISTS deleted_at, DROP COLUMN IF EXISTS row_version, DROP COLUMN IF EXISTS display_order, DROP COLUMN IF EXISTS active;
