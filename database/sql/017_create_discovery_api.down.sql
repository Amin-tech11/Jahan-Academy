DROP INDEX IF EXISTS ix_program_translations_search;
DROP INDEX IF EXISTS ix_university_translations_search;
ALTER TABLE program_translations DROP COLUMN IF EXISTS search_vector;
ALTER TABLE university_translations DROP COLUMN IF EXISTS search_vector;

