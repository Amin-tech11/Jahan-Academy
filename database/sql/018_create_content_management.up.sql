CREATE TABLE content_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug varchar(160) NOT NULL UNIQUE,
    status varchar(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    display_order integer NOT NULL DEFAULT 0,
    row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
    published_at timestamptz,
    archived_at timestamptz,
    archived_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    archive_reason varchar(500),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE content_category_translations (
    category_id uuid NOT NULL REFERENCES content_categories(id) ON DELETE CASCADE,
    locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    name varchar(180) NOT NULL,
    description text,
    seo_title varchar(180),
    seo_description varchar(320),
    PRIMARY KEY (category_id, locale)
);

CREATE TABLE content_tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug varchar(160) NOT NULL UNIQUE,
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

CREATE TABLE content_tag_translations (
    tag_id uuid NOT NULL REFERENCES content_tags(id) ON DELETE CASCADE,
    locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    name varchar(120) NOT NULL,
    description text,
    PRIMARY KEY (tag_id, locale)
);

CREATE TABLE content_authors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    slug varchar(160) NOT NULL UNIQUE,
    avatar_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
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

CREATE TABLE content_author_translations (
    author_id uuid NOT NULL REFERENCES content_authors(id) ON DELETE CASCADE,
    locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    name varchar(180) NOT NULL,
    title varchar(180),
    biography text,
    PRIMARY KEY (author_id, locale)
);

ALTER TABLE articles
    ADD COLUMN author_id uuid REFERENCES content_authors(id) ON DELETE SET NULL,
    ADD COLUMN featured boolean NOT NULL DEFAULT false,
    ADD COLUMN row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
    ADD COLUMN archived_at timestamptz,
    ADD COLUMN archived_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN archive_reason varchar(500);

CREATE TABLE article_categories (
    article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES content_categories(id) ON DELETE RESTRICT,
    is_primary boolean NOT NULL DEFAULT false,
    PRIMARY KEY (article_id, category_id)
);

CREATE TABLE article_tags (
    article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES content_tags(id) ON DELETE RESTRICT,
    PRIMARY KEY (article_id, tag_id)
);

ALTER TABLE article_translations
    ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple'::regconfig, coalesce(title, '')), 'A') ||
        setweight(to_tsvector('simple'::regconfig, coalesce(excerpt, '')), 'B') ||
        setweight(to_tsvector('simple'::regconfig, coalesce(body, '')), 'C')
    ) STORED;

CREATE UNIQUE INDEX uq_article_primary_category
    ON article_categories(article_id) WHERE is_primary;
CREATE INDEX ix_content_categories_public
    ON content_categories(display_order, created_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX ix_content_tags_public
    ON content_tags(created_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX ix_content_authors_public
    ON content_authors(created_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX ix_articles_admin
    ON articles(status, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX ix_articles_featured_public
    ON articles(featured DESC, published_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX ix_article_categories_category ON article_categories(category_id, article_id);
CREATE INDEX ix_article_tags_tag ON article_tags(tag_id, article_id);
CREATE INDEX ix_article_translations_search
    ON article_translations USING gin(search_vector);

INSERT INTO permissions(code, description) VALUES
    ('content.read', 'Read content administration data'),
    ('content.write', 'Create and edit content'),
    ('content.publish', 'Publish and archive content')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO role_permissions(role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code = 'super_admin'
  AND permissions.code IN ('content.read','content.write','content.publish')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code = 'content_editor'
  AND permissions.code IN ('content.read','content.write','content.publish')
ON CONFLICT DO NOTHING;
