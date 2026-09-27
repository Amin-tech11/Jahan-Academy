from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.exc import IntegrityError

from app.modules.experience.domain import StaleExperienceError
from app.modules.experience.repository import ExperienceRepository
from app.modules.experience.schemas import CountryGuideView, PublicPageView
from app.shared.exceptions import ApplicationError


class ExperienceService:
    def __init__(self, repository: ExperienceRepository) -> None:
        self._repository = repository

    async def home(self, locale: str) -> PublicPageView:
        row = await self._repository.get_home(locale)
        if row is None:
            raise self._not_found("home page")
        return self._page_view(row, admin=False)

    async def public_page(self, slug: str, locale: str) -> PublicPageView:
        row = await self._repository.get_page(locale=locale, slug=slug, public_only=True)
        if row is None:
            raise self._not_found("page")
        return self._page_view(row, admin=False)

    async def admin_page(self, page_id: UUID, locale: str) -> PublicPageView:
        row = await self._repository.get_page(locale=locale, page_id=page_id)
        if row is None:
            raise self._not_found("page")
        return self._page_view(row, admin=True)

    async def list_admin_pages(self, locale: str) -> list[PublicPageView]:
        rows = await self._repository.list_pages(locale=locale, public_only=False)
        return [self._page_view(row, admin=True) for row in rows]

    async def create_page(
        self, payload: dict[str, Any], actor_id: UUID, locale: str
    ) -> PublicPageView:
        base, translations = self._page_values(payload)
        try:
            page_id = await self._repository.create_page(base)
            await self._repository.replace_page_translations(page_id, translations)
            row = await self._require_page(page_id, locale)
            await self._repository.audit(
                actor_id=actor_id,
                action="experience.page.created",
                entity_type="public_page",
                entity_id=page_id,
                before=None,
                after=row,
            )
            await self._repository.session.commit()
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise ApplicationError(
                "EXPERIENCE_CONFLICT", "A page with this slug or kind already exists.", 409
            ) from exc
        return self._page_view(row, admin=True)

    async def update_page(
        self,
        page_id: UUID,
        payload: dict[str, Any],
        actor_id: UUID,
        expected_version: int,
        locale: str,
    ) -> PublicPageView:
        before = await self._require_page(page_id, locale)
        base, translations = self._page_values(payload)
        try:
            await self._repository.update_page(page_id, base, expected_version)
            await self._repository.replace_page_translations(page_id, translations)
            row = await self._require_page(page_id, locale)
            await self._repository.audit(
                actor_id=actor_id,
                action="experience.page.updated",
                entity_type="public_page",
                entity_id=page_id,
                before=before,
                after=row,
            )
            await self._repository.session.commit()
        except StaleExperienceError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise ApplicationError(
                "EXPERIENCE_CONFLICT", "A page with this slug or kind already exists.", 409
            ) from exc
        return self._page_view(row, admin=True)

    async def publish_page(
        self, page_id: UUID, actor_id: UUID, expected_version: int, locale: str
    ) -> PublicPageView:
        before = await self._require_page(page_id, locale)
        self._require_complete(before["translations"])
        return await self._change_page_status(
            page_id, "published", None, actor_id, expected_version, locale, before
        )

    async def archive_page(
        self, page_id: UUID, reason: str, actor_id: UUID, expected_version: int, locale: str
    ) -> PublicPageView:
        before = await self._require_page(page_id, locale)
        return await self._change_page_status(
            page_id, "archived", reason, actor_id, expected_version, locale, before
        )

    async def list_guides(self, locale: str) -> list[CountryGuideView]:
        return [
            self._guide_view(row, admin=False)
            for row in await self._repository.list_guides(locale=locale, public_only=True)
        ]

    async def public_guide(self, country_slug: str, locale: str) -> CountryGuideView:
        row = await self._repository.get_guide(
            locale=locale, country_slug=country_slug, public_only=True
        )
        if row is None:
            raise self._not_found("country guide")
        return self._guide_view(row, admin=False)

    async def admin_guide(self, guide_id: UUID, locale: str) -> CountryGuideView:
        row = await self._repository.get_guide(locale=locale, guide_id=guide_id)
        if row is None:
            raise self._not_found("country guide")
        return self._guide_view(row, admin=True)

    async def list_admin_guides(self, locale: str) -> list[CountryGuideView]:
        rows = await self._repository.list_guides(locale=locale, public_only=False)
        return [self._guide_view(row, admin=True) for row in rows]

    async def create_guide(
        self, payload: dict[str, Any], actor_id: UUID, locale: str
    ) -> CountryGuideView:
        country_id, translations = self._guide_values(payload)
        if not await self._repository.country_exists(country_id):
            raise ApplicationError("INVALID_COUNTRY", "Country was not found.", 422)
        try:
            guide_id = await self._repository.create_guide(country_id)
            await self._repository.replace_guide_translations(guide_id, translations)
            row = await self._require_guide(guide_id, locale)
            await self._repository.audit(
                actor_id=actor_id,
                action="experience.country_guide.created",
                entity_type="country_guide",
                entity_id=guide_id,
                before=None,
                after=row,
            )
            await self._repository.session.commit()
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise ApplicationError(
                "EXPERIENCE_CONFLICT", "A guide already exists for this country.", 409
            ) from exc
        return self._guide_view(row, admin=True)

    async def update_guide(
        self,
        guide_id: UUID,
        payload: dict[str, Any],
        actor_id: UUID,
        expected_version: int,
        locale: str,
    ) -> CountryGuideView:
        before = await self._require_guide(guide_id, locale)
        country_id, translations = self._guide_values(payload)
        if not await self._repository.country_exists(country_id):
            raise ApplicationError("INVALID_COUNTRY", "Country was not found.", 422)
        try:
            await self._repository.update_guide(guide_id, country_id, expected_version)
            await self._repository.replace_guide_translations(guide_id, translations)
            row = await self._require_guide(guide_id, locale)
            await self._repository.audit(
                actor_id=actor_id,
                action="experience.country_guide.updated",
                entity_type="country_guide",
                entity_id=guide_id,
                before=before,
                after=row,
            )
            await self._repository.session.commit()
        except StaleExperienceError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise ApplicationError(
                "EXPERIENCE_CONFLICT", "A guide already exists for this country.", 409
            ) from exc
        return self._guide_view(row, admin=True)

    async def publish_guide(
        self, guide_id: UUID, actor_id: UUID, expected_version: int, locale: str
    ) -> CountryGuideView:
        before = await self._require_guide(guide_id, locale)
        self._require_complete(before["translations"])
        return await self._change_guide_status(
            guide_id, "published", None, actor_id, expected_version, locale, before
        )

    async def archive_guide(
        self, guide_id: UUID, reason: str, actor_id: UUID, expected_version: int, locale: str
    ) -> CountryGuideView:
        before = await self._require_guide(guide_id, locale)
        return await self._change_guide_status(
            guide_id, "archived", reason, actor_id, expected_version, locale, before
        )

    async def _change_page_status(
        self,
        page_id: UUID,
        status: str,
        reason: str | None,
        actor_id: UUID,
        expected_version: int,
        locale: str,
        before: dict[str, Any],
    ) -> PublicPageView:
        try:
            await self._repository.set_page_status(
                page_id, status, actor_id, expected_version, reason
            )
            row = await self._require_page(page_id, locale)
            await self._repository.audit(
                actor_id=actor_id,
                action=f"experience.page.{status}",
                entity_type="public_page",
                entity_id=page_id,
                before=before,
                after=row,
            )
            await self._repository.session.commit()
        except StaleExperienceError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        return self._page_view(row, admin=True)

    async def _change_guide_status(
        self,
        guide_id: UUID,
        status: str,
        reason: str | None,
        actor_id: UUID,
        expected_version: int,
        locale: str,
        before: dict[str, Any],
    ) -> CountryGuideView:
        try:
            await self._repository.set_guide_status(
                guide_id, status, actor_id, expected_version, reason
            )
            row = await self._require_guide(guide_id, locale)
            await self._repository.audit(
                actor_id=actor_id,
                action=f"experience.country_guide.{status}",
                entity_type="country_guide",
                entity_id=guide_id,
                before=before,
                after=row,
            )
            await self._repository.session.commit()
        except StaleExperienceError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        return self._guide_view(row, admin=True)

    def _page_values(
        self, payload: dict[str, Any]
    ) -> tuple[dict[str, Any], dict[str, dict[str, Any]]]:
        translations = payload.pop("translations")
        return {
            "slug": payload["slug"],
            "page_kind": self._value(payload["page_kind"]),
            "display_order": payload["display_order"],
        }, translations

    def _guide_values(self, payload: dict[str, Any]) -> tuple[UUID, dict[str, dict[str, Any]]]:
        return payload["country_id"], payload["translations"]

    async def _require_page(self, page_id: UUID, locale: str) -> dict[str, Any]:
        row = await self._repository.get_page(locale=locale, page_id=page_id)
        if row is None:
            raise self._not_found("page")
        return row

    async def _require_guide(self, guide_id: UUID, locale: str) -> dict[str, Any]:
        row = await self._repository.get_guide(locale=locale, guide_id=guide_id)
        if row is None:
            raise self._not_found("country guide")
        return row

    @staticmethod
    def _require_complete(translations: dict[str, dict[str, Any]]) -> None:
        if set(translations) != {"fa", "en"}:
            raise ApplicationError(
                "CONTENT_INCOMPLETE", "Both Persian and English translations are required.", 422
            )

    @staticmethod
    def _page_view(row: dict[str, Any], *, admin: bool) -> PublicPageView:
        return PublicPageView(
            id=row["id"],
            slug=row["slug"],
            page_kind=row["page_kind"],
            display_order=row["display_order"],
            status=row["status"],
            title=row["title"],
            summary=row.get("summary"),
            body=row.get("body"),
            seo_title=row.get("seo_title"),
            seo_description=row.get("seo_description"),
            blocks=row["blocks"],
            translations=row.get("translations") if admin else None,
            published_at=row.get("published_at"),
            archived_at=row.get("archived_at"),
            archive_reason=row.get("archive_reason"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            version=row["row_version"],
        )

    @staticmethod
    def _guide_view(row: dict[str, Any], *, admin: bool) -> CountryGuideView:
        return CountryGuideView(
            id=row["id"],
            country_id=row["country_id"],
            country_slug=row["country_slug"],
            country_name=row["country_name"],
            status=row["status"],
            title=row["title"],
            summary=row["summary"],
            seo_title=row.get("seo_title"),
            seo_description=row.get("seo_description"),
            facts=row["facts"],
            sections=row["sections"],
            sources=row["sources"],
            translations=row.get("translations") if admin else None,
            published_at=row.get("published_at"),
            archived_at=row.get("archived_at"),
            archive_reason=row.get("archive_reason"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            version=row["row_version"],
        )

    @staticmethod
    def _value(value: Any) -> str:
        return value.value if hasattr(value, "value") else str(value)

    @staticmethod
    def _not_found(entity: str) -> ApplicationError:
        return ApplicationError("EXPERIENCE_NOT_FOUND", f"{entity.title()} was not found.", 404)

    @staticmethod
    def _stale() -> ApplicationError:
        return ApplicationError("STALE_EXPERIENCE", "Content was changed by another request.", 412)
