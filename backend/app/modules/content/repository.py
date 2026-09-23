from __future__ import annotations

import json
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.content.domain import (
    ArticleSort,
    ContentResource,
    StaleContentError,
)

REFERENCE_SQL = {
    ContentResource.CATEGORY: {
        "table": "content_categories",
        "translations": "content_category_translations",
        "foreign_key": "category_id",
        "extra": "display_order",
    },
    ContentResource.TAG: {
        "table": "content_tags",
        "translations": "content_tag_translations",
        "foreign_key": "tag_id",
        "extra": "",
    },
    ContentResource.AUTHOR: {
        "table": "content_authors",
        "translations": "content_author_translations",
        "foreign_key": "author_id",
        "extra": "user_id, avatar_media_id",
    },
}

ARTICLE_SORT_SQL = {
    ArticleSort.RELEVANCE: "search_rank DESC, a.featured DESC, a.published_at DESC NULLS LAST",
    ArticleSort.NEWEST: "a.published_at DESC NULLS LAST, a.created_at DESC, a.id DESC",
    ArticleSort.OLDEST: "a.published_at ASC NULLS LAST, a.created_at ASC, a.id ASC",
    ArticleSort.TITLE_ASC: "at.title ASC, a.id ASC",
    ArticleSort.TITLE_DESC: "at.title DESC, a.id DESC",
    ArticleSort.UPDATED_DESC: "a.updated_at DESC, a.id DESC",
}


class ContentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_references(
        self,
        *,
        resource: ContentResource,
        locale: str,
        page: int,
        limit: int,
        query: str | None,
        public_only: bool,
        status: str | None,
    ) -> tuple[list[dict[str, Any]], int]:
        meta = REFERENCE_SQL[resource]
        table = meta["table"]
        translations = meta["translations"]
        foreign_key = meta["foreign_key"]
        conditions = ["r.deleted_at IS NULL"]
        params: dict[str, Any] = {
            "locale": locale,
            "limit": limit,
            "offset": (page - 1) * limit,
        }
        if public_only:
            conditions.append("r.status = 'published'")
        elif status:
            conditions.append("r.status = :status")
            params["status"] = status
        if query:
            conditions.append("(rt.name ILIKE :query OR r.slug ILIKE :query)")
            params["query"] = f"%{query}%"
        where = " AND ".join(conditions)
        total = int(
            await self.session.scalar(
                text(
                    f"SELECT count(*) FROM {table} r JOIN {translations} rt "  # nosec B608
                    f"ON rt.{foreign_key} = r.id AND rt.locale = :locale WHERE {where}"  # nosec B608
                ),
                params,
            )
            or 0
        )
        optional_columns = {
            ContentResource.CATEGORY: (
                "rt.description, rt.seo_title, rt.seo_description, r.display_order,"
            ),
            ContentResource.TAG: (
                "rt.description, NULL AS seo_title, NULL AS seo_description, 0 AS display_order,"
            ),
            ContentResource.AUTHOR: (
                "rt.biography AS description, rt.biography, rt.title, NULL AS seo_title, "
                "NULL AS seo_description, 0 AS display_order, r.user_id, r.avatar_media_id,"
            ),
        }[resource]
        rows = await self.session.execute(
            text(
                f"SELECT r.*, rt.name, {optional_columns} "  # nosec B608
                f"'{resource.value}' AS resource FROM {table} r "  # nosec B608
                f"JOIN {translations} rt ON rt.{foreign_key} = r.id "  # nosec B608
                f"AND rt.locale = :locale WHERE {where} "  # nosec B608
                "ORDER BY display_order, rt.name, r.id LIMIT :limit OFFSET :offset"
            ),
            params,
        )
        return [dict(row._mapping) for row in rows], total

    async def get_reference(
        self,
        *,
        resource: ContentResource,
        locale: str,
        item_id: UUID | None = None,
        slug: str | None = None,
        public_only: bool = False,
    ) -> dict[str, Any] | None:
        meta = REFERENCE_SQL[resource]
        table = meta["table"]
        translations = meta["translations"]
        foreign_key = meta["foreign_key"]
        selector = "r.id = :selector" if item_id else "r.slug = :selector"
        conditions = [selector, "r.deleted_at IS NULL"]
        if public_only:
            conditions.append("r.status = 'published'")
        optional_columns = {
            ContentResource.CATEGORY: (
                "rt.description, rt.seo_title, rt.seo_description, r.display_order,"
            ),
            ContentResource.TAG: (
                "rt.description, NULL AS seo_title, NULL AS seo_description, 0 AS display_order,"
            ),
            ContentResource.AUTHOR: (
                "rt.biography AS description, rt.biography, rt.title, NULL AS seo_title, "
                "NULL AS seo_description, 0 AS display_order, r.user_id, r.avatar_media_id,"
            ),
        }[resource]
        row = (
            (
                await self.session.execute(
                    text(
                        f"SELECT r.*, rt.name, {optional_columns} "  # nosec B608
                        f"'{resource.value}' AS resource FROM {table} r "  # nosec B608
                        f"JOIN {translations} rt ON rt.{foreign_key} = r.id "  # nosec B608
                        "AND rt.locale = :locale "
                        f"WHERE {' AND '.join(conditions)}"  # nosec B608
                    ),
                    {"locale": locale, "selector": item_id or slug},
                )
            )
            .mappings()
            .one_or_none()
        )
        if row is None:
            return None
        result = dict(row)
        result["translations"] = await self._reference_translations(resource, result["id"])
        return result

    async def create_reference(self, resource: ContentResource, values: dict[str, Any]) -> UUID:
        item_id = uuid4()
        if resource is ContentResource.CATEGORY:
            await self.session.execute(
                text(
                    "INSERT INTO content_categories (id, slug, display_order) "
                    "VALUES (:id, :slug, :display_order)"
                ),
                {"id": item_id, **values},
            )
        elif resource is ContentResource.TAG:
            await self.session.execute(
                text("INSERT INTO content_tags (id, slug) VALUES (:id, :slug)"),
                {"id": item_id, **values},
            )
        else:
            await self.session.execute(
                text(
                    "INSERT INTO content_authors (id, slug, user_id, avatar_media_id) "
                    "VALUES (:id, :slug, :user_id, :avatar_media_id)"
                ),
                {"id": item_id, **values},
            )
        return item_id

    async def update_reference(
        self,
        resource: ContentResource,
        item_id: UUID,
        values: dict[str, Any],
        expected_version: int,
    ) -> None:
        if resource is ContentResource.CATEGORY:
            assignments = "slug = :slug, display_order = :display_order"
        elif resource is ContentResource.TAG:
            assignments = "slug = :slug"
        else:
            assignments = "slug = :slug, user_id = :user_id, avatar_media_id = :avatar_media_id"
        table = REFERENCE_SQL[resource]["table"]
        updated = await self.session.scalar(
            text(
                f"UPDATE {table} SET {assignments}, updated_at = now(), "  # nosec B608
                "row_version = row_version + 1 WHERE id = :id AND row_version = :version "
                "AND deleted_at IS NULL RETURNING id"
            ),
            {"id": item_id, "version": expected_version, **values},
        )
        if updated is None:
            raise StaleContentError

    async def replace_reference_translations(
        self,
        resource: ContentResource,
        item_id: UUID,
        translations: dict[str, dict[str, Any]],
    ) -> None:
        meta = REFERENCE_SQL[resource]
        table = meta["translations"]
        foreign_key = meta["foreign_key"]
        await self.session.execute(
            text(f"DELETE FROM {table} WHERE {foreign_key} = :id"),  # nosec B608
            {"id": item_id},
        )
        for locale, item in translations.items():
            if resource is ContentResource.CATEGORY:
                await self.session.execute(
                    text(
                        "INSERT INTO content_category_translations "
                        "(category_id, locale, name, description, seo_title, seo_description) "
                        "VALUES (:id, :locale, :name, :description, :seo_title, :seo_description)"
                    ),
                    {"id": item_id, "locale": locale, **item},
                )
            elif resource is ContentResource.TAG:
                await self.session.execute(
                    text(
                        "INSERT INTO content_tag_translations (tag_id, locale, name, description) "
                        "VALUES (:id, :locale, :name, :description)"
                    ),
                    {"id": item_id, "locale": locale, **item},
                )
            else:
                await self.session.execute(
                    text(
                        "INSERT INTO content_author_translations "
                        "(author_id, locale, name, title, biography) "
                        "VALUES (:id, :locale, :name, :title, :biography)"
                    ),
                    {"id": item_id, "locale": locale, **item},
                )

    async def set_reference_status(
        self,
        resource: ContentResource,
        item_id: UUID,
        status: str,
        expected_version: int,
        actor_id: UUID,
        reason: str | None = None,
    ) -> None:
        table = REFERENCE_SQL[resource]["table"]
        if status == "published":
            state = (
                "status = 'published', published_at = COALESCE(published_at, now()), "
                "archived_at = NULL, archived_by_user_id = NULL, archive_reason = NULL"
            )
        else:
            state = (
                "status = 'archived', archived_at = now(), archived_by_user_id = :actor_id, "
                "archive_reason = :reason"
            )
        updated = await self.session.scalar(
            text(
                f"UPDATE {table} SET {state}, updated_at = now(), "  # nosec B608
                "row_version = row_version + 1 WHERE id = :id AND row_version = :version "
                "AND deleted_at IS NULL RETURNING id"
            ),
            {
                "id": item_id,
                "version": expected_version,
                "actor_id": actor_id,
                "reason": reason,
            },
        )
        if updated is None:
            raise StaleContentError

    async def delete_reference_draft(
        self, resource: ContentResource, item_id: UUID, expected_version: int
    ) -> str:
        table = REFERENCE_SQL[resource]["table"]
        status = await self.session.scalar(
            text(f"SELECT status FROM {table} WHERE id = :id AND deleted_at IS NULL"),  # nosec B608
            {"id": item_id},
        )
        if status is None:
            return "missing"
        if status != "draft":
            return "not_draft"
        dependency_sql = {
            ContentResource.CATEGORY: (
                "SELECT count(*) FROM article_categories WHERE category_id = :id"
            ),
            ContentResource.TAG: "SELECT count(*) FROM article_tags WHERE tag_id = :id",
            ContentResource.AUTHOR: "SELECT count(*) FROM articles WHERE author_id = :id",
        }[resource]
        if int(await self.session.scalar(text(dependency_sql), {"id": item_id}) or 0):
            return "dependent"
        deleted = await self.session.scalar(
            text(
                f"DELETE FROM {table} WHERE id = :id AND row_version = :version RETURNING id"  # nosec B608
            ),
            {"id": item_id, "version": expected_version},
        )
        if deleted is None:
            raise StaleContentError
        return "deleted"

    async def list_articles(self, **filters: Any) -> tuple[list[dict[str, Any]], int]:
        locale = filters["locale"]
        query = filters["query"]
        public_only = filters["public_only"]
        conditions = ["a.deleted_at IS NULL"]
        params: dict[str, Any] = {
            "locale": locale,
            "limit": filters["limit"],
            "offset": (filters["page"] - 1) * filters["limit"],
            "search_query": query or "",
        }
        if public_only:
            conditions.extend(["a.status = 'published'", "a.published_at <= now()"])
        elif filters["status"]:
            conditions.append("a.status = :status")
            params["status"] = filters["status"]
        mappings = {
            "article_type": "a.article_type",
            "author_id": "a.author_id",
            "featured": "a.featured",
        }
        for key, column in mappings.items():
            if filters[key] is not None:
                conditions.append(f"{column} = :{key}")
                params[key] = filters[key]
        if filters["category_id"]:
            conditions.append(
                "EXISTS (SELECT 1 FROM article_categories acf WHERE acf.article_id = a.id "
                "AND acf.category_id = :category_id)"
            )
            params["category_id"] = filters["category_id"]
        if filters["tag_id"]:
            conditions.append(
                "EXISTS (SELECT 1 FROM article_tags atf WHERE atf.article_id = a.id "
                "AND atf.tag_id = :tag_id)"
            )
            params["tag_id"] = filters["tag_id"]
        if query:
            conditions.append(
                "(at.search_vector @@ websearch_to_tsquery('simple', :search_query) "
                "OR at.title ILIKE :query OR a.slug ILIKE :query)"
            )
            params["query"] = f"%{query}%"
        where = " AND ".join(conditions)
        joins = (
            "JOIN article_translations at ON at.article_id = a.id AND at.locale = :locale "
            "LEFT JOIN content_authors au ON au.id = a.author_id "
            "LEFT JOIN content_author_translations aut ON aut.author_id = au.id "
            "AND aut.locale = :locale "
        )
        total = int(
            await self.session.scalar(
                text(f"SELECT count(*) FROM articles a {joins} WHERE {where}"),  # nosec B608
                params,
            )
            or 0
        )
        sort = filters["sort"]
        if query and sort is ArticleSort.NEWEST:
            sort = ArticleSort.RELEVANCE
        rows = await self.session.execute(
            text(
                "SELECT a.*, at.title, at.excerpt, at.body, at.seo_title, at.seo_description, "
                "aut.name AS author_name, au.slug AS author_slug, "
                "ts_rank_cd(at.search_vector, "
                "websearch_to_tsquery('simple', :search_query)) AS search_rank "
                f"FROM articles a {joins} WHERE {where} "  # nosec B608
                f"ORDER BY {ARTICLE_SORT_SQL[sort]} LIMIT :limit OFFSET :offset"  # nosec B608
            ),
            params,
        )
        return [dict(row._mapping) for row in rows], total

    async def get_article(
        self,
        *,
        locale: str,
        article_id: UUID | None = None,
        slug: str | None = None,
        public_only: bool = False,
    ) -> dict[str, Any] | None:
        selector = "a.id = :selector" if article_id else "a.slug = :selector"
        conditions = [selector, "a.deleted_at IS NULL"]
        if public_only:
            conditions.extend(["a.status = 'published'", "a.published_at <= now()"])
        row = (
            (
                await self.session.execute(
                    text(
                        "SELECT a.*, at.title, at.excerpt, at.body, at.seo_title, "
                        "at.seo_description, aut.name AS author_name, au.slug AS author_slug "
                        "FROM articles a JOIN article_translations at ON at.article_id = a.id "
                        "AND at.locale = :locale LEFT JOIN content_authors au "
                        "ON au.id = a.author_id "
                        "LEFT JOIN content_author_translations aut ON aut.author_id = au.id "
                        "AND aut.locale = :locale "
                        f"WHERE {' AND '.join(conditions)}"  # nosec B608
                    ),
                    {"locale": locale, "selector": article_id or slug},
                )
            )
            .mappings()
            .one_or_none()
        )
        if row is None:
            return None
        result = dict(row)
        await self.hydrate_articles([result], locale, translations=True)
        return result

    async def hydrate_articles(
        self, rows: list[dict[str, Any]], locale: str, *, translations: bool = False
    ) -> list[dict[str, Any]]:
        for row in rows:
            row["categories"] = await self._article_references(
                row["id"], locale, ContentResource.CATEGORY
            )
            row["tags"] = await self._article_references(row["id"], locale, ContentResource.TAG)
            if translations:
                row["translations"] = await self._article_translations(row["id"])
        return rows

    async def create_article(self, values: dict[str, Any]) -> UUID:
        article_id = uuid4()
        await self.session.execute(
            text(
                "INSERT INTO articles (id, slug, article_type, author_id, featured_media_id, "
                "featured) VALUES (:id, :slug, :article_type, :author_id, :featured_media_id, "
                ":featured)"
            ),
            {"id": article_id, **values},
        )
        return article_id

    async def update_article(
        self, article_id: UUID, values: dict[str, Any], expected_version: int
    ) -> None:
        updated = await self.session.scalar(
            text(
                "UPDATE articles SET slug = :slug, article_type = :article_type, "
                "author_id = :author_id, featured_media_id = :featured_media_id, "
                "featured = :featured, updated_at = now(), row_version = row_version + 1 "
                "WHERE id = :id AND row_version = :version AND deleted_at IS NULL RETURNING id"
            ),
            {"id": article_id, "version": expected_version, **values},
        )
        if updated is None:
            raise StaleContentError

    async def replace_article_children(
        self,
        article_id: UUID,
        translations: dict[str, dict[str, Any]],
        category_ids: list[UUID],
        primary_category_id: UUID | None,
        tag_ids: list[UUID],
    ) -> None:
        await self.session.execute(
            text("DELETE FROM article_translations WHERE article_id = :id"), {"id": article_id}
        )
        await self.session.execute(
            text("DELETE FROM article_categories WHERE article_id = :id"), {"id": article_id}
        )
        await self.session.execute(
            text("DELETE FROM article_tags WHERE article_id = :id"), {"id": article_id}
        )
        for locale, item in translations.items():
            await self.session.execute(
                text(
                    "INSERT INTO article_translations (article_id, locale, title, excerpt, body, "
                    "seo_title, seo_description) VALUES (:id, :locale, :title, :excerpt, :body, "
                    ":seo_title, :seo_description)"
                ),
                {"id": article_id, "locale": locale, **item},
            )
        for category_id in category_ids:
            await self.session.execute(
                text(
                    "INSERT INTO article_categories (article_id, category_id, is_primary) "
                    "VALUES (:article_id, :category_id, :is_primary)"
                ),
                {
                    "article_id": article_id,
                    "category_id": category_id,
                    "is_primary": category_id == primary_category_id,
                },
            )
        for tag_id in tag_ids:
            await self.session.execute(
                text("INSERT INTO article_tags (article_id, tag_id) VALUES (:id, :tag_id)"),
                {"id": article_id, "tag_id": tag_id},
            )

    async def article_context(
        self,
        *,
        author_id: UUID | None,
        media_id: UUID | None,
        category_ids: list[UUID],
        tag_ids: list[UUID],
    ) -> dict[str, Any]:
        author = None
        if author_id:
            author = (
                (
                    await self.session.execute(
                        text(
                            "SELECT status FROM content_authors WHERE id = :id "
                            "AND deleted_at IS NULL"
                        ),
                        {"id": author_id},
                    )
                )
                .mappings()
                .one_or_none()
            )
        media = None
        if media_id:
            media = (
                (
                    await self.session.execute(
                        text(
                            "SELECT purpose, upload_status FROM media_assets "
                            "WHERE id = :id AND deleted_at IS NULL"
                        ),
                        {"id": media_id},
                    )
                )
                .mappings()
                .one_or_none()
            )
        categories: dict[UUID, str] = {}
        if category_ids:
            category_rows = await self.session.execute(
                text(
                    "SELECT id, status FROM content_categories WHERE id = ANY(:ids) "
                    "AND deleted_at IS NULL"
                ),
                {"ids": category_ids},
            )
            categories = {row.id: row.status for row in category_rows}
        tags: dict[UUID, str] = {}
        if tag_ids:
            tag_rows = await self.session.execute(
                text(
                    "SELECT id, status FROM content_tags WHERE id = ANY(:ids) "
                    "AND deleted_at IS NULL"
                ),
                {"ids": tag_ids},
            )
            tags = {row.id: row.status for row in tag_rows}
        return {"author": author, "media": media, "categories": categories, "tags": tags}

    async def set_article_status(
        self,
        article_id: UUID,
        status: str,
        expected_version: int,
        actor_id: UUID,
        reason: str | None = None,
        published_at: Any = None,
    ) -> None:
        if status == "published":
            state = (
                "status = 'published', published_at = COALESCE(:published_at, now()), "
                "archived_at = NULL, archived_by_user_id = NULL, archive_reason = NULL"
            )
        else:
            state = (
                "status = 'archived', archived_at = now(), archived_by_user_id = :actor_id, "
                "archive_reason = :reason"
            )
        updated = await self.session.scalar(
            text(
                f"UPDATE articles SET {state}, updated_at = now(), "  # nosec B608
                "row_version = row_version + 1 WHERE id = :id AND row_version = :version "
                "AND deleted_at IS NULL RETURNING id"
            ),
            {
                "id": article_id,
                "version": expected_version,
                "actor_id": actor_id,
                "reason": reason,
                "published_at": published_at,
            },
        )
        if updated is None:
            raise StaleContentError

    async def delete_article_draft(self, article_id: UUID, expected_version: int) -> str:
        status = await self.session.scalar(
            text("SELECT status FROM articles WHERE id = :id AND deleted_at IS NULL"),
            {"id": article_id},
        )
        if status is None:
            return "missing"
        if status != "draft":
            return "not_draft"
        deleted = await self.session.scalar(
            text("DELETE FROM articles WHERE id = :id AND row_version = :version RETURNING id"),
            {"id": article_id, "version": expected_version},
        )
        if deleted is None:
            raise StaleContentError
        return "deleted"

    async def audit(
        self,
        *,
        actor_id: UUID,
        action: str,
        entity_type: str,
        entity_id: UUID,
        before: dict[str, Any] | None,
        after: dict[str, Any] | None,
    ) -> None:
        def safe(value: dict[str, Any] | None) -> str | None:
            if value is None:
                return None
            keys = ("id", "slug", "article_type", "status", "featured", "row_version")
            return json.dumps({key: value.get(key) for key in keys}, default=str)

        await self.session.execute(
            text(
                "INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, "
                "before_safe, after_safe) VALUES (:actor, :action, :entity_type, :entity_id, "
                "CAST(:before AS jsonb), CAST(:after AS jsonb))"
            ),
            {
                "actor": actor_id,
                "action": action,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "before": safe(before),
                "after": safe(after),
            },
        )

    async def _reference_translations(
        self, resource: ContentResource, item_id: UUID
    ) -> dict[str, dict[str, Any]]:
        if resource is ContentResource.CATEGORY:
            query = (
                "SELECT locale, name, description, seo_title, seo_description "
                "FROM content_category_translations WHERE category_id = :id"
            )
        elif resource is ContentResource.TAG:
            query = (
                "SELECT locale, name, description FROM content_tag_translations WHERE tag_id = :id"
            )
        else:
            query = (
                "SELECT locale, name, title, biography FROM content_author_translations "
                "WHERE author_id = :id"
            )
        rows = await self.session.execute(text(query), {"id": item_id})
        return {
            row.locale: {key: value for key, value in dict(row._mapping).items() if key != "locale"}
            for row in rows
        }

    async def _article_references(
        self, article_id: UUID, locale: str, resource: ContentResource
    ) -> list[dict[str, Any]]:
        if resource is ContentResource.CATEGORY:
            query = (
                "SELECT c.id, c.slug, ct.name, ac.is_primary FROM article_categories ac "
                "JOIN content_categories c ON c.id = ac.category_id "
                "JOIN content_category_translations ct ON ct.category_id = c.id "
                "AND ct.locale = :locale WHERE ac.article_id = :id "
                "ORDER BY ac.is_primary DESC, c.display_order, ct.name"
            )
        else:
            query = (
                "SELECT t.id, t.slug, tt.name FROM article_tags atg "
                "JOIN content_tags t ON t.id = atg.tag_id "
                "JOIN content_tag_translations tt ON tt.tag_id = t.id "
                "AND tt.locale = :locale WHERE atg.article_id = :id ORDER BY tt.name"
            )
        rows = await self.session.execute(text(query), {"id": article_id, "locale": locale})
        return [dict(row._mapping) for row in rows]

    async def _article_translations(self, article_id: UUID) -> dict[str, dict[str, Any]]:
        rows = await self.session.execute(
            text(
                "SELECT locale, title, excerpt, body, seo_title, seo_description "
                "FROM article_translations WHERE article_id = :id"
            ),
            {"id": article_id},
        )
        return {
            row.locale: {key: value for key, value in dict(row._mapping).items() if key != "locale"}
            for row in rows
        }
