# ruff: noqa: E501

from __future__ import annotations

import json
from typing import Any, cast
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.experience.domain import StaleExperienceError


class ExperienceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_page(
        self,
        *,
        locale: str,
        page_id: UUID | None = None,
        slug: str | None = None,
        public_only: bool = False,
    ) -> dict[str, Any] | None:
        selector = "p.id = :selector" if page_id else "p.slug = :selector"
        conditions = [selector, "p.deleted_at IS NULL"]
        if public_only:
            conditions.extend(["p.status = 'published'", "p.published_at <= now()"])
        row = (
            (
                await self.session.execute(
                    text(
                        "SELECT p.*, pt.title, pt.summary, pt.body, pt.seo_title, pt.seo_description, pt.blocks "
                        "FROM public_pages p JOIN public_page_translations pt ON pt.page_id = p.id "
                        "AND pt.locale = :locale WHERE " + " AND ".join(conditions)
                    ),
                    {"locale": locale, "selector": page_id or slug},
                )
            )
            .mappings()
            .one_or_none()
        )
        if row is None:
            return None
        result = dict(row)
        result["blocks"] = self._json(result["blocks"])
        result["translations"] = await self._page_translations(result["id"])
        return result

    async def get_home(self, locale: str) -> dict[str, Any] | None:
        return await self.get_page(locale=locale, slug="home", public_only=True)

    async def list_pages(self, *, locale: str, public_only: bool) -> list[dict[str, Any]]:
        conditions = ["p.deleted_at IS NULL"]
        if public_only:
            conditions.extend(["p.status = 'published'", "p.published_at <= now()"])
        rows = await self.session.execute(
            text(
                "SELECT p.*, pt.title, pt.summary, pt.body, pt.seo_title, pt.seo_description, pt.blocks "
                "FROM public_pages p JOIN public_page_translations pt ON pt.page_id = p.id "
                "AND pt.locale = :locale WHERE "
                + " AND ".join(conditions)
                + " ORDER BY p.display_order, pt.title, p.id"
            ),
            {"locale": locale},
        )
        result: list[dict[str, Any]] = []
        for row in rows:
            item = dict(row._mapping)
            item["blocks"] = self._json(item["blocks"])
            item["translations"] = await self._page_translations(item["id"])
            result.append(item)
        return result

    async def create_page(self, values: dict[str, Any]) -> UUID:
        page_id = uuid4()
        await self.session.execute(
            text(
                "INSERT INTO public_pages (id, slug, page_kind, display_order) VALUES (:id, :slug, :page_kind, :display_order)"
            ),
            {"id": page_id, **values},
        )
        return page_id

    async def update_page(
        self, page_id: UUID, values: dict[str, Any], expected_version: int
    ) -> None:
        updated = await self.session.scalar(
            text(
                "UPDATE public_pages SET slug = :slug, page_kind = :page_kind, display_order = :display_order, "
                "updated_at = now(), row_version = row_version + 1 WHERE id = :id AND row_version = :version "
                "AND deleted_at IS NULL RETURNING id"
            ),
            {"id": page_id, "version": expected_version, **values},
        )
        if updated is None:
            raise StaleExperienceError

    async def replace_page_translations(
        self, page_id: UUID, translations: dict[str, dict[str, Any]]
    ) -> None:
        await self.session.execute(
            text("DELETE FROM public_page_translations WHERE page_id = :id"), {"id": page_id}
        )
        for locale, item in translations.items():
            await self.session.execute(
                text(
                    "INSERT INTO public_page_translations "
                    "(page_id, locale, title, summary, body, seo_title, seo_description, blocks) "
                    "VALUES (:id, :locale, :title, :summary, :body, :seo_title, :seo_description, CAST(:blocks AS jsonb))"
                ),
                {"id": page_id, "locale": locale, **item, "blocks": json.dumps(item["blocks"])},
            )

    async def set_page_status(
        self,
        page_id: UUID,
        status: str,
        actor_id: UUID,
        expected_version: int,
        reason: str | None = None,
    ) -> None:
        state = (
            "status = 'published', published_at = COALESCE(published_at, now()), archived_at = NULL, "
            "archived_by_user_id = NULL, archive_reason = NULL"
            if status == "published"
            else "status = 'archived', archived_at = now(), archived_by_user_id = :actor_id, archive_reason = :reason"
        )
        updated = await self.session.scalar(
            text(
                f"UPDATE public_pages SET {state}, updated_at = now(), row_version = row_version + 1 "  # nosec B608
                "WHERE id = :id AND row_version = :version AND deleted_at IS NULL RETURNING id"
            ),
            {"id": page_id, "version": expected_version, "actor_id": actor_id, "reason": reason},
        )
        if updated is None:
            raise StaleExperienceError

    async def list_guides(self, *, locale: str, public_only: bool) -> list[dict[str, Any]]:
        conditions = ["g.deleted_at IS NULL", "c.deleted_at IS NULL"]
        if public_only:
            conditions.extend(
                ["g.status = 'published'", "g.published_at <= now()", "c.status = 'published'"]
            )
        rows = await self.session.execute(
            text(
                "SELECT g.*, c.id AS country_id, c.slug AS country_slug, ct.name AS country_name, "
                "gt.title, gt.summary, gt.seo_title, gt.seo_description, gt.facts, gt.sections, gt.sources "
                "FROM country_guides g JOIN countries c ON c.id = g.country_id "
                "JOIN country_translations ct ON ct.country_id = c.id AND ct.locale = :locale "
                "JOIN country_guide_translations gt ON gt.country_guide_id = g.id AND gt.locale = :locale "
                "WHERE " + " AND ".join(conditions) + " ORDER BY gt.title, g.id"
            ),
            {"locale": locale},
        )
        return [await self._guide_row(dict(row._mapping)) for row in rows]

    async def get_guide(
        self,
        *,
        locale: str,
        guide_id: UUID | None = None,
        country_slug: str | None = None,
        public_only: bool = False,
    ) -> dict[str, Any] | None:
        selector = "g.id = :selector" if guide_id else "c.slug = :selector"
        conditions = [selector, "g.deleted_at IS NULL", "c.deleted_at IS NULL"]
        if public_only:
            conditions.extend(
                ["g.status = 'published'", "g.published_at <= now()", "c.status = 'published'"]
            )
        row = (
            (
                await self.session.execute(
                    text(
                        "SELECT g.*, c.id AS country_id, c.slug AS country_slug, ct.name AS country_name, "
                        "gt.title, gt.summary, gt.seo_title, gt.seo_description, gt.facts, gt.sections, gt.sources "
                        "FROM country_guides g JOIN countries c ON c.id = g.country_id "
                        "JOIN country_translations ct ON ct.country_id = c.id AND ct.locale = :locale "
                        "JOIN country_guide_translations gt ON gt.country_guide_id = g.id AND gt.locale = :locale "
                        "WHERE " + " AND ".join(conditions)
                    ),
                    {"locale": locale, "selector": guide_id or country_slug},
                )
            )
            .mappings()
            .one_or_none()
        )
        return await self._guide_row(dict(row)) if row else None

    async def create_guide(self, country_id: UUID) -> UUID:
        guide_id = uuid4()
        await self.session.execute(
            text("INSERT INTO country_guides (id, country_id) VALUES (:id, :country_id)"),
            {"id": guide_id, "country_id": country_id},
        )
        return guide_id

    async def update_guide(self, guide_id: UUID, country_id: UUID, expected_version: int) -> None:
        updated = await self.session.scalar(
            text(
                "UPDATE country_guides SET country_id = :country_id, updated_at = now(), row_version = row_version + 1 "
                "WHERE id = :id AND row_version = :version AND deleted_at IS NULL RETURNING id"
            ),
            {"id": guide_id, "country_id": country_id, "version": expected_version},
        )
        if updated is None:
            raise StaleExperienceError

    async def replace_guide_translations(
        self, guide_id: UUID, translations: dict[str, dict[str, Any]]
    ) -> None:
        await self.session.execute(
            text("DELETE FROM country_guide_translations WHERE country_guide_id = :id"),
            {"id": guide_id},
        )
        for locale, item in translations.items():
            await self.session.execute(
                text(
                    "INSERT INTO country_guide_translations "
                    "(country_guide_id, locale, title, summary, seo_title, seo_description, facts, sections, sources) "
                    "VALUES (:id, :locale, :title, :summary, :seo_title, :seo_description, CAST(:facts AS jsonb), CAST(:sections AS jsonb), CAST(:sources AS jsonb))"
                ),
                {
                    "id": guide_id,
                    "locale": locale,
                    **item,
                    "facts": json.dumps(item["facts"]),
                    "sections": json.dumps(item["sections"]),
                    "sources": json.dumps(item["sources"]),
                },
            )

    async def set_guide_status(
        self,
        guide_id: UUID,
        status: str,
        actor_id: UUID,
        expected_version: int,
        reason: str | None = None,
    ) -> None:
        state = (
            "status = 'published', published_at = COALESCE(published_at, now()), archived_at = NULL, "
            "archived_by_user_id = NULL, archive_reason = NULL"
            if status == "published"
            else "status = 'archived', archived_at = now(), archived_by_user_id = :actor_id, archive_reason = :reason"
        )
        updated = await self.session.scalar(
            text(
                f"UPDATE country_guides SET {state}, updated_at = now(), row_version = row_version + 1 "  # nosec B608
                "WHERE id = :id AND row_version = :version AND deleted_at IS NULL RETURNING id"
            ),
            {"id": guide_id, "version": expected_version, "actor_id": actor_id, "reason": reason},
        )
        if updated is None:
            raise StaleExperienceError

    async def country_exists(self, country_id: UUID) -> bool:
        return bool(
            await self.session.scalar(
                text("SELECT 1 FROM countries WHERE id = :id AND deleted_at IS NULL"),
                {"id": country_id},
            )
        )

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
        await self.session.execute(
            text(
                "INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, before_safe, after_safe) VALUES (:actor, :action, :entity_type, :entity_id, CAST(:before AS jsonb), CAST(:after AS jsonb))"
            ),
            {
                "actor": actor_id,
                "action": action,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "before": self._audit_payload(before),
                "after": self._audit_payload(after),
            },
        )

    async def _page_translations(self, page_id: UUID) -> dict[str, dict[str, Any]]:
        rows = await self.session.execute(
            text(
                "SELECT locale, title, summary, body, seo_title, seo_description, blocks FROM public_page_translations WHERE page_id = :id"
            ),
            {"id": page_id},
        )
        return {
            row.locale: {
                "title": row.title,
                "summary": row.summary,
                "body": row.body,
                "seo_title": row.seo_title,
                "seo_description": row.seo_description,
                "blocks": self._json(row.blocks),
            }
            for row in rows
        }

    async def _guide_row(self, row: dict[str, Any]) -> dict[str, Any]:
        row["facts"] = self._json(row["facts"])
        row["sections"] = self._json(row["sections"])
        row["sources"] = self._json(row["sources"])
        rows = await self.session.execute(
            text(
                "SELECT locale, title, summary, seo_title, seo_description, facts, sections, sources FROM country_guide_translations WHERE country_guide_id = :id"
            ),
            {"id": row["id"]},
        )
        row["translations"] = {
            item.locale: {
                "title": item.title,
                "summary": item.summary,
                "seo_title": item.seo_title,
                "seo_description": item.seo_description,
                "facts": self._json(item.facts),
                "sections": self._json(item.sections),
                "sources": self._json(item.sources),
            }
            for item in rows
        }
        return row

    @staticmethod
    def _json(value: Any) -> list[dict[str, Any]]:
        decoded = json.loads(value) if isinstance(value, str) else value
        return cast(list[dict[str, Any]], decoded)

    @staticmethod
    def _audit_payload(value: dict[str, Any] | None) -> str | None:
        if value is None:
            return None
        return json.dumps(
            {key: value.get(key) for key in ("id", "slug", "status", "country_id", "row_version")},
            default=str,
        )
