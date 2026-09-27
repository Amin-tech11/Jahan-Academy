CREATE TABLE public_pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug varchar(180) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    page_kind varchar(24) NOT NULL CHECK (page_kind IN ('home','static','service')),
    status varchar(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
    published_at timestamptz,
    archived_at timestamptz,
    archived_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    archive_reason varchar(500),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

CREATE UNIQUE INDEX uq_public_pages_single_home
    ON public_pages(page_kind) WHERE page_kind = 'home' AND deleted_at IS NULL;

CREATE TABLE public_page_translations (
    page_id uuid NOT NULL REFERENCES public_pages(id) ON DELETE CASCADE,
    locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    title varchar(260) NOT NULL,
    summary varchar(1200),
    body text,
    seo_title varchar(180),
    seo_description varchar(320),
    blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
    PRIMARY KEY (page_id, locale)
);

CREATE TABLE country_guides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id uuid NOT NULL UNIQUE REFERENCES countries(id) ON DELETE RESTRICT,
    status varchar(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
    published_at timestamptz,
    archived_at timestamptz,
    archived_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    archive_reason varchar(500),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE country_guide_translations (
    country_guide_id uuid NOT NULL REFERENCES country_guides(id) ON DELETE CASCADE,
    locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    title varchar(260) NOT NULL,
    summary varchar(1200) NOT NULL,
    seo_title varchar(180),
    seo_description varchar(320),
    facts jsonb NOT NULL DEFAULT '[]'::jsonb,
    sections jsonb NOT NULL DEFAULT '[]'::jsonb,
    sources jsonb NOT NULL DEFAULT '[]'::jsonb,
    PRIMARY KEY (country_guide_id, locale)
);

CREATE INDEX ix_public_pages_public_list ON public_pages(display_order, updated_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX ix_country_guides_public_list ON country_guides(updated_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;

ALTER TABLE faq_assignments DROP CONSTRAINT faq_assignments_target_type_check;
ALTER TABLE faq_assignments ADD CONSTRAINT faq_assignments_target_type_check
    CHECK (target_type IN ('general','homepage','page','country','university','program','course','service','article'));
