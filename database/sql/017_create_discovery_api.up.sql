ALTER TABLE university_translations
    ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple'::regconfig, coalesce(name, '')), 'A') ||
        setweight(to_tsvector('simple'::regconfig, coalesce(short_description, '')), 'B') ||
        setweight(to_tsvector('simple'::regconfig, coalesce(body, '')), 'C')
    ) STORED;

ALTER TABLE program_translations
    ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple'::regconfig, coalesce(title, '')), 'A') ||
        setweight(to_tsvector('simple'::regconfig, coalesce(short_description, '')), 'B') ||
        setweight(to_tsvector('simple'::regconfig, coalesce(body, '')), 'C') ||
        setweight(to_tsvector('simple'::regconfig, coalesce(admission_requirements, '')), 'C')
    ) STORED;

CREATE INDEX ix_university_translations_search
    ON university_translations USING gin(search_vector);
CREATE INDEX ix_program_translations_search
    ON program_translations USING gin(search_vector);

