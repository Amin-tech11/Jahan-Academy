from __future__ import annotations

import json
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.universities.domain import StaleUniversityError, UniversitySort

SORT_SQL = {
    UniversitySort.RELEVANCE: "search_rank DESC, u.featured DESC, ut.name ASC",
    UniversitySort.FEATURED: "u.featured DESC, u.created_at DESC, u.id DESC",
    UniversitySort.NAME_ASC: "ut.name ASC, u.id ASC",
    UniversitySort.NAME_DESC: "ut.name DESC, u.id DESC",
    UniversitySort.RANK_ASC: "primary_rank ASC NULLS LAST, ut.name ASC",
    UniversitySort.NEWEST: "u.created_at DESC, u.id DESC",
    UniversitySort.UPDATED_DESC: "u.updated_at DESC, u.id DESC",
}


class UniversityRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_items(
        self,
        *,
        locale: str,
        page: int,
        limit: int,
        public_only: bool,
        query: str | None,
        country_id: UUID | None,
        city_id: UUID | None,
        institution_type: str | None,
        status: str | None,
        maximum_rank: int | None,
        sort: UniversitySort,
    ) -> tuple[list[dict[str, Any]], int]:
        conditions = ["u.deleted_at IS NULL"]
        params: dict[str, Any] = {
            "locale": locale,
            "limit": limit,
            "offset": (page - 1) * limit,
            "search_query": query or "",
        }
        if public_only:
            conditions.append("u.status = 'published'")
        elif status:
            conditions.append("u.status = :status")
            params["status"] = status
        if query:
            conditions.append(
                "(ut.search_vector @@ websearch_to_tsquery('simple', :search_query) "
                "OR ut.name ILIKE :query OR u.slug ILIKE :query)"
            )
            params["query"] = f"%{query}%"
        if country_id:
            conditions.append("u.country_id = :country_id")
            params["country_id"] = country_id
        if city_id:
            conditions.append("u.city_id = :city_id")
            params["city_id"] = city_id
        if institution_type:
            conditions.append("u.institution_type = :institution_type")
            params["institution_type"] = institution_type
        if maximum_rank:
            conditions.append(
                "EXISTS (SELECT 1 FROM university_rankings urf WHERE urf.university_id = u.id "
                "AND urf.rank_value <= :maximum_rank)"
            )
            params["maximum_rank"] = maximum_rank
        where = " AND ".join(conditions)
        effective_sort = (
            UniversitySort.RELEVANCE if query and sort is UniversitySort.FEATURED else sort
        )
        joins = (
            " JOIN university_translations ut ON ut.university_id = u.id AND ut.locale = :locale "
            " JOIN countries c ON c.id = u.country_id "
            " JOIN country_translations ct ON ct.country_id = c.id AND ct.locale = :locale "
            " LEFT JOIN cities ci ON ci.id = u.city_id "
            " LEFT JOIN city_translations cit ON cit.city_id = ci.id AND cit.locale = :locale "
        )
        total = int(
            await self.session.scalar(
                text(f"SELECT count(*) FROM universities u {joins} WHERE {where}"),  # nosec B608
                params,
            )
            or 0
        )
        rows = await self.session.execute(
            text(
                "SELECT u.*, ut.name, ut.short_description, ut.body, ut.seo_title, "
                "ut.seo_description, ct.name AS country_name, cit.name AS city_name, "
                "ts_rank_cd(ut.search_vector, "
                "websearch_to_tsquery('simple', :search_query)) AS search_rank, "
                "(SELECT min(rank_value) FROM university_rankings ur "
                " WHERE ur.university_id = u.id) AS primary_rank "
                f"FROM universities u {joins} WHERE {where} "  # nosec B608
                f"ORDER BY {SORT_SQL[effective_sort]} "  # nosec B608
                "LIMIT :limit OFFSET :offset"
            ),
            params,
        )
        return [dict(row._mapping) for row in rows], total

    async def get(
        self,
        *,
        locale: str,
        university_id: UUID | None = None,
        slug: str | None = None,
        public_only: bool = False,
    ) -> dict[str, Any] | None:
        selector = "u.id = :selector" if university_id else "u.slug = :selector"
        conditions = [selector, "u.deleted_at IS NULL"]
        if public_only:
            conditions.append("u.status = 'published'")
        row = (
            (
                await self.session.execute(
                    text(
                        "SELECT u.*, ut.name, ut.short_description, ut.body, ut.seo_title, "
                        "ut.seo_description, ct.name AS country_name, cit.name AS city_name "
                        "FROM universities u "
                        "JOIN university_translations ut ON ut.university_id = u.id "
                        "AND ut.locale = :locale "
                        "JOIN country_translations ct ON ct.country_id = u.country_id "
                        "AND ct.locale = :locale "
                        "LEFT JOIN city_translations cit ON cit.city_id = u.city_id "
                        "AND cit.locale = :locale "
                        f"WHERE {' AND '.join(conditions)}"  # nosec B608
                    ),
                    {"locale": locale, "selector": university_id or slug},
                )
            )
            .mappings()
            .one_or_none()
        )
        if row is None:
            return None
        result = dict(row)
        result["translations"] = await self._translations(result["id"])
        result["rankings"] = await self._rankings(result["id"])
        result["media"] = await self._media(result["id"])
        return result

    async def hydrate_list(self, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        for row in rows:
            row["rankings"] = await self._rankings(row["id"])
            row["media"] = await self._media(row["id"])
        return rows

    async def reference_context(
        self, country_id: UUID, city_id: UUID | None, currency: str | None
    ) -> dict[str, bool]:
        country = bool(
            await self.session.scalar(
                text(
                    "SELECT EXISTS (SELECT 1 FROM countries WHERE id = :id "
                    "AND status <> 'archived' AND deleted_at IS NULL)"
                ),
                {"id": country_id},
            )
        )
        city = True
        if city_id:
            city = bool(
                await self.session.scalar(
                    text(
                        "SELECT EXISTS (SELECT 1 FROM cities WHERE id = :city_id "
                        "AND country_id = :country_id AND active AND deleted_at IS NULL)"
                    ),
                    {"city_id": city_id, "country_id": country_id},
                )
            )
        currency_exists = True
        if currency:
            currency_exists = bool(
                await self.session.scalar(
                    text("SELECT EXISTS (SELECT 1 FROM currencies WHERE code = :code AND active)"),
                    {"code": currency},
                )
            )
        return {"country": country, "city": city, "currency": currency_exists}

    async def media_context(self, asset_ids: list[UUID]) -> dict[UUID, dict[str, Any]]:
        if not asset_ids:
            return {}
        rows = await self.session.execute(
            text(
                "SELECT id, purpose, upload_status, mime_type FROM media_assets "
                "WHERE id = ANY(:ids) AND deleted_at IS NULL"
            ),
            {"ids": asset_ids},
        )
        return {UUID(str(row.id)): dict(row._mapping) for row in rows}

    async def create(self, values: dict[str, Any]) -> UUID:
        university_id = uuid4()
        await self.session.execute(
            text(
                "INSERT INTO universities (id, country_id, city_id, slug, institution_type, "
                "founded_year, website_url, contact_email, contact_phone, featured, tuition_mode, "
                "tuition_min_minor, tuition_max_minor, tuition_currency) VALUES (:id, :country_id, "
                ":city_id, :slug, :institution_type, :founded_year, :website_url, :contact_email, "
                ":contact_phone, :featured, :tuition_mode, :tuition_min_minor, "
                ":tuition_max_minor, :tuition_currency)"
            ),
            {"id": university_id, **values},
        )
        return university_id

    async def update_base(
        self, university_id: UUID, values: dict[str, Any], expected_version: int
    ) -> None:
        updated = await self.session.scalar(
            text(
                "UPDATE universities SET country_id = :country_id, city_id = :city_id, "
                "slug = :slug, institution_type = :institution_type, founded_year = :founded_year, "
                "website_url = :website_url, contact_email = :contact_email, "
                "contact_phone = :contact_phone, featured = :featured, "
                "tuition_mode = :tuition_mode, "
                "tuition_min_minor = :tuition_min_minor, tuition_max_minor = :tuition_max_minor, "
                "tuition_currency = :tuition_currency, updated_at = now(), "
                "row_version = row_version + 1 "
                "WHERE id = :id AND row_version = :version AND deleted_at IS NULL RETURNING id"
            ),
            {"id": university_id, "version": expected_version, **values},
        )
        if updated is None:
            raise StaleUniversityError

    async def replace_children(
        self,
        university_id: UUID,
        translations: dict[str, dict[str, Any]],
        rankings: list[dict[str, Any]],
        media: list[dict[str, Any]],
    ) -> None:
        await self.session.execute(
            text("DELETE FROM university_translations WHERE university_id = :id"),
            {"id": university_id},
        )
        await self.session.execute(
            text("DELETE FROM university_rankings WHERE university_id = :id"), {"id": university_id}
        )
        await self.session.execute(
            text("DELETE FROM university_media WHERE university_id = :id"), {"id": university_id}
        )
        for locale, item in translations.items():
            await self.session.execute(
                text(
                    "INSERT INTO university_translations (university_id, locale, name, "
                    "short_description, body, seo_title, seo_description) VALUES (:university_id, "
                    ":locale, :name, :short_description, :body, :seo_title, :seo_description)"
                ),
                {"university_id": university_id, "locale": locale, **item},
            )
        for item in rankings:
            await self.session.execute(
                text(
                    "INSERT INTO university_rankings (university_id, organization, ranking_year, "
                    "rank_value, rank_band, source_url) VALUES (:university_id, :organization, "
                    ":ranking_year, :rank_value, :rank_band, :source_url)"
                ),
                {"university_id": university_id, **item},
            )
        for item in media:
            await self.session.execute(
                text(
                    "INSERT INTO university_media (university_id, media_asset_id, media_role, "
                    "display_order) VALUES (:university_id, :media_asset_id, :media_role, "
                    ":display_order)"
                ),
                {"university_id": university_id, **item},
            )

    async def publish(self, university_id: UUID, expected_version: int) -> None:
        updated = await self.session.scalar(
            text(
                "UPDATE universities SET status = 'published', "
                "published_at = COALESCE(published_at, now()), "
                "archived_at = NULL, archived_by_user_id = NULL, archive_reason = NULL, "
                "updated_at = now(), row_version = row_version + 1 WHERE id = :id "
                "AND row_version = :version AND deleted_at IS NULL RETURNING id"
            ),
            {"id": university_id, "version": expected_version},
        )
        if updated is None:
            raise StaleUniversityError

    async def archive(
        self, university_id: UUID, actor_id: UUID, reason: str, expected_version: int
    ) -> None:
        updated = await self.session.scalar(
            text(
                "UPDATE universities SET status = 'archived', archived_at = now(), "
                "archived_by_user_id = :actor_id, archive_reason = :reason, updated_at = now(), "
                "row_version = row_version + 1 WHERE id = :id AND row_version = :version "
                "AND deleted_at IS NULL RETURNING id"
            ),
            {
                "id": university_id,
                "actor_id": actor_id,
                "reason": reason,
                "version": expected_version,
            },
        )
        if updated is None:
            raise StaleUniversityError

    async def hard_delete_draft(self, university_id: UUID, expected_version: int) -> str:
        status = await self.session.scalar(
            text("SELECT status FROM universities WHERE id = :id AND deleted_at IS NULL"),
            {"id": university_id},
        )
        if status is None:
            return "missing"
        if status != "draft":
            return "not_draft"
        dependencies = int(
            await self.session.scalar(
                text(
                    "SELECT count(*) FROM programs WHERE university_id = :id AND deleted_at IS NULL"
                ),
                {"id": university_id},
            )
            or 0
        )
        if dependencies:
            return "dependent"
        deleted = await self.session.scalar(
            text("DELETE FROM universities WHERE id = :id AND row_version = :version RETURNING id"),
            {"id": university_id, "version": expected_version},
        )
        if deleted is None:
            raise StaleUniversityError
        return "deleted"

    async def audit(
        self,
        *,
        actor_user_id: UUID,
        action: str,
        university_id: UUID,
        before: dict[str, Any] | None,
        after: dict[str, Any] | None,
    ) -> None:
        def safe(value: dict[str, Any] | None) -> str | None:
            if value is None:
                return None
            snapshot = {
                key: value.get(key)
                for key in (
                    "id",
                    "slug",
                    "country_id",
                    "city_id",
                    "status",
                    "featured",
                    "row_version",
                )
            }
            return json.dumps(snapshot, default=str)

        await self.session.execute(
            text(
                "INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, "
                "before_safe, "
                "after_safe) VALUES (:actor, :action, 'university', :id, CAST(:before AS jsonb), "
                "CAST(:after AS jsonb))"
            ),
            {
                "actor": actor_user_id,
                "action": action,
                "id": university_id,
                "before": safe(before),
                "after": safe(after),
            },
        )

    async def _translations(self, university_id: UUID) -> dict[str, dict[str, Any]]:
        rows = await self.session.execute(
            text(
                "SELECT locale, name, short_description, body, seo_title, seo_description "
                "FROM university_translations WHERE university_id = :id"
            ),
            {"id": university_id},
        )
        return {
            row.locale: {key: value for key, value in dict(row._mapping).items() if key != "locale"}
            for row in rows
        }

    async def _rankings(self, university_id: UUID) -> list[dict[str, Any]]:
        rows = await self.session.execute(
            text(
                "SELECT id, organization, ranking_year AS year, rank_value AS rank, "
                "rank_band AS band, "
                "source_url FROM university_rankings WHERE university_id = :id "
                "ORDER BY ranking_year DESC, rank_value ASC NULLS LAST, organization"
            ),
            {"id": university_id},
        )
        return [dict(row._mapping) for row in rows]

    async def _media(self, university_id: UUID) -> list[dict[str, Any]]:
        rows = await self.session.execute(
            text(
                "SELECT um.media_asset_id, um.media_role AS role, um.display_order, ma.mime_type, "
                "ma.width, ma.height, ma.alt_fa, ma.alt_en FROM university_media um "
                "JOIN media_assets ma ON ma.id = um.media_asset_id "
                "WHERE um.university_id = :id AND ma.upload_status = 'ready' "
                "AND ma.deleted_at IS NULL "
                "ORDER BY CASE um.media_role WHEN 'logo' THEN 0 WHEN 'hero' THEN 1 ELSE 2 END, "
                "um.display_order, um.media_asset_id"
            ),
            {"id": university_id},
        )
        return [dict(row._mapping) for row in rows]
