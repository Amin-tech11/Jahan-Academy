CREATE TABLE countries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    iso2 char(2) NOT NULL UNIQUE,
    iso3 char(3) UNIQUE,
    slug varchar(120) NOT NULL UNIQUE,
    status varchar(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    featured boolean NOT NULL DEFAULT false,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE TABLE country_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), country_id uuid NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')), name varchar(160) NOT NULL, summary text, body text,
    seo_title varchar(180), seo_description varchar(320), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (country_id, locale)
);
CREATE TABLE cities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), country_id uuid NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
    normalized_name varchar(160) NOT NULL, slug varchar(160) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (country_id, slug)
);
CREATE INDEX ix_cities_country ON cities(country_id);
CREATE TABLE city_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')), name varchar(160) NOT NULL, summary text,
    UNIQUE (city_id, locale)
);

ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_nationality_country FOREIGN KEY (nationality_country_id) REFERENCES countries(id) ON DELETE SET NULL;
ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_residence_country FOREIGN KEY (residence_country_id) REFERENCES countries(id) ON DELETE SET NULL;

CREATE TABLE media_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    storage_provider varchar(40) NOT NULL, bucket varchar(120) NOT NULL, object_key varchar(500) NOT NULL,
    original_filename varchar(255), mime_type varchar(150) NOT NULL, size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
    checksum_sha256 char(64) NOT NULL, privacy_class varchar(24) NOT NULL DEFAULT 'public' CHECK (privacy_class IN ('public','private','quarantine','learning')),
    scan_status varchar(24) NOT NULL DEFAULT 'not_required' CHECK (scan_status IN ('not_required','pending','clean','infected','failed')),
    width integer, height integer, duration_seconds numeric(12,3), alt_fa varchar(300), alt_en varchar(300),
    source_url text, attribution text, created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
    UNIQUE (bucket, object_key), UNIQUE (checksum_sha256, privacy_class)
);
CREATE INDEX ix_media_assets_owner ON media_assets(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE TABLE media_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    variant_code varchar(60) NOT NULL, object_key varchar(500) NOT NULL, mime_type varchar(150) NOT NULL,
    size_bytes bigint NOT NULL CHECK (size_bytes >= 0), width integer, height integer, bitrate integer,
    created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (media_asset_id, variant_code)
);

CREATE TABLE universities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), country_id uuid NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
    city_id uuid REFERENCES cities(id) ON DELETE SET NULL, slug varchar(180) NOT NULL UNIQUE,
    institution_type varchar(40), founded_year smallint CHECK (founded_year BETWEEN 1000 AND 2200),
    website_url text, contact_email varchar(320), status varchar(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    featured boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE INDEX ix_universities_country_city ON universities(country_id, city_id) WHERE deleted_at IS NULL;
CREATE TABLE university_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), university_id uuid NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')), name varchar(240) NOT NULL, short_description text, body text,
    seo_title varchar(180), seo_description varchar(320), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (university_id, locale)
);
CREATE INDEX ix_university_translations_name ON university_translations(locale, name);
CREATE TABLE university_media (
    university_id uuid NOT NULL REFERENCES universities(id) ON DELETE CASCADE, media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
    media_role varchar(24) NOT NULL CHECK (media_role IN ('logo','hero','gallery','video')), display_order integer NOT NULL DEFAULT 0,
    PRIMARY KEY (university_id, media_asset_id, media_role)
);
CREATE TABLE university_rankings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), university_id uuid NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    organization varchar(120) NOT NULL, ranking_year smallint NOT NULL, rank_value integer CHECK (rank_value > 0), rank_band varchar(60), source_url text,
    created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (university_id, organization, ranking_year)
);

CREATE TABLE academic_levels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(40) NOT NULL UNIQUE, display_order integer NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true
);
CREATE TABLE academic_level_translations (
    academic_level_id uuid NOT NULL REFERENCES academic_levels(id) ON DELETE CASCADE, locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    name varchar(120) NOT NULL, description text, PRIMARY KEY (academic_level_id, locale)
);
CREATE TABLE fields_of_study (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), parent_id uuid REFERENCES fields_of_study(id) ON DELETE SET NULL,
    code varchar(80) NOT NULL UNIQUE, slug varchar(160) NOT NULL UNIQUE, active boolean NOT NULL DEFAULT true, display_order integer NOT NULL DEFAULT 0
);
CREATE TABLE field_of_study_translations (
    field_of_study_id uuid NOT NULL REFERENCES fields_of_study(id) ON DELETE CASCADE, locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    name varchar(180) NOT NULL, description text, PRIMARY KEY (field_of_study_id, locale)
);
CREATE TABLE programs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), university_id uuid NOT NULL REFERENCES universities(id) ON DELETE RESTRICT,
    academic_level_id uuid NOT NULL REFERENCES academic_levels(id) ON DELETE RESTRICT, primary_field_id uuid REFERENCES fields_of_study(id) ON DELETE SET NULL,
    slug varchar(200) NOT NULL UNIQUE, duration_value numeric(8,2), duration_unit varchar(20) CHECK (duration_unit IN ('week','month','year')),
    tuition_mode varchar(20) NOT NULL DEFAULT 'contact' CHECK (tuition_mode IN ('exact','range','contact')),
    tuition_min_minor bigint CHECK (tuition_min_minor >= 0), tuition_max_minor bigint CHECK (tuition_max_minor >= 0), tuition_currency char(3),
    application_fee_minor bigint CHECK (application_fee_minor >= 0), application_fee_currency char(3), teaching_language_code varchar(20), official_url text,
    status varchar(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')), featured boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
    CHECK ((tuition_mode = 'contact') OR (tuition_min_minor IS NOT NULL AND tuition_currency IS NOT NULL)),
    CHECK (tuition_max_minor IS NULL OR tuition_min_minor IS NULL OR tuition_max_minor >= tuition_min_minor)
);
CREATE INDEX ix_programs_discovery ON programs(university_id, academic_level_id, primary_field_id, status) WHERE deleted_at IS NULL;
CREATE TABLE program_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')), title varchar(260) NOT NULL, short_description text, body text,
    admission_requirements text, seo_title varchar(180), seo_description varchar(320), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (program_id, locale)
);
CREATE INDEX ix_program_translations_title ON program_translations(locale, title);
CREATE TABLE program_fields (
    program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE, field_of_study_id uuid NOT NULL REFERENCES fields_of_study(id) ON DELETE RESTRICT,
    is_primary boolean NOT NULL DEFAULT false, PRIMARY KEY (program_id, field_of_study_id)
);
CREATE TABLE intakes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(20) NOT NULL UNIQUE CHECK (code IN ('spring','summer','fall','winter','unknown')),
    display_order integer NOT NULL DEFAULT 0
);
CREATE TABLE program_intakes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    intake_id uuid NOT NULL REFERENCES intakes(id) ON DELETE RESTRICT, intake_year smallint NOT NULL CHECK (intake_year BETWEEN 2020 AND 2200),
    application_deadline date, status varchar(20) NOT NULL DEFAULT 'open' CHECK (status IN ('planned','open','closed','cancelled')),
    notes_fa text, notes_en text, UNIQUE (program_id, intake_id, intake_year)
);
CREATE INDEX ix_program_intakes_deadline ON program_intakes(status, application_deadline);
CREATE TABLE program_requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    requirement_type varchar(40) NOT NULL, code varchar(80), required boolean NOT NULL DEFAULT true,
    value_json jsonb NOT NULL DEFAULT '{}'::jsonb, description_fa text, description_en text, display_order integer NOT NULL DEFAULT 0
);
CREATE TABLE program_media (
    program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE, media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
    media_role varchar(24) NOT NULL CHECK (media_role IN ('hero','gallery','video')), display_order integer NOT NULL DEFAULT 0,
    PRIMARY KEY (program_id, media_asset_id, media_role)
);

INSERT INTO intakes(code, display_order) VALUES ('spring',10),('summer',20),('fall',30),('winter',40),('unknown',50) ON CONFLICT DO NOTHING;
