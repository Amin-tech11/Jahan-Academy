DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE code IN ('content.read','content.write','content.publish')
);
DELETE FROM permissions WHERE code IN ('content.read','content.write','content.publish');

DROP INDEX IF EXISTS ix_article_translations_search;
DROP INDEX IF EXISTS ix_article_tags_tag;
DROP INDEX IF EXISTS ix_article_categories_category;
DROP INDEX IF EXISTS ix_articles_featured_public;
DROP INDEX IF EXISTS ix_articles_admin;
DROP INDEX IF EXISTS ix_content_authors_public;
DROP INDEX IF EXISTS ix_content_tags_public;
DROP INDEX IF EXISTS ix_content_categories_public;
DROP INDEX IF EXISTS uq_article_primary_category;

ALTER TABLE article_translations DROP COLUMN IF EXISTS search_vector;
DROP TABLE IF EXISTS article_tags;
DROP TABLE IF EXISTS article_categories;
ALTER TABLE articles
    DROP COLUMN IF EXISTS archive_reason,
    DROP COLUMN IF EXISTS archived_by_user_id,
    DROP COLUMN IF EXISTS archived_at,
    DROP COLUMN IF EXISTS row_version,
    DROP COLUMN IF EXISTS featured,
    DROP COLUMN IF EXISTS author_id;
DROP TABLE IF EXISTS content_author_translations;
DROP TABLE IF EXISTS content_authors;
DROP TABLE IF EXISTS content_tag_translations;
DROP TABLE IF EXISTS content_tags;
DROP TABLE IF EXISTS content_category_translations;
DROP TABLE IF EXISTS content_categories;
