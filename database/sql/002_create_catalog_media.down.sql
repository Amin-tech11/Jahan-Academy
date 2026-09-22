ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS fk_user_profiles_residence_country;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS fk_user_profiles_nationality_country;
DROP TABLE IF EXISTS program_media, program_requirements, program_intakes, intakes, program_fields, program_translations, programs;
DROP TABLE IF EXISTS field_of_study_translations, fields_of_study, academic_level_translations, academic_levels;
DROP TABLE IF EXISTS university_rankings, university_media, university_translations, universities;
DROP TABLE IF EXISTS media_variants, media_assets, city_translations, cities, country_translations, countries;
