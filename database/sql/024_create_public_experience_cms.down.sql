ALTER TABLE faq_assignments DROP CONSTRAINT faq_assignments_target_type_check;
ALTER TABLE faq_assignments ADD CONSTRAINT faq_assignments_target_type_check
    CHECK (target_type IN ('general','homepage','page','country','university','program','course','service'));

DROP TABLE IF EXISTS country_guide_translations;
DROP TABLE IF EXISTS country_guides;
DROP TABLE IF EXISTS public_page_translations;
DROP TABLE IF EXISTS public_pages;
