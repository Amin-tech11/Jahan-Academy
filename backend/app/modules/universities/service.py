from __future__ import annotations

from math import ceil
from typing import Any
from uuid import UUID

from sqlalchemy.exc import IntegrityError

from app.modules.universities.domain import (
    StaleUniversityError,
    UniversityMediaRole,
    UniversitySort,
)
from app.modules.universities.repository import UniversityRepository
from app.modules.universities.schemas import (
    PublicUniversityPage,
    PublicUniversityView,
    ReferenceSummary,
    TuitionView,
    UniversityMediaView,
    UniversityPage,
    UniversityPageMeta,
    UniversityTranslationView,
    UniversityView,
)
from app.shared.exceptions import ApplicationError


class UniversityService:
    def __init__(self, repository: UniversityRepository) -> None:
        self._repository = repository

    async def list_public(
        self,
        *,
        locale: str,
        page: int,
        limit: int,
        query: str | None,
        country_id: UUID | None,
    ) -> PublicUniversityPage:
        rows, total = await self._repository.list_items(
            locale=locale,
            page=page,
            limit=limit,
            public_only=True,
            query=query,
            country_id=country_id,
            city_id=None,
            institution_type=None,
            status=None,
            maximum_rank=None,
            sort=UniversitySort.FEATURED,
        )
        rows = await self._repository.hydrate_list(rows)
        return PublicUniversityPage(
            data=[self._public_view(row) for row in rows],
            meta=UniversityPageMeta(
                page=page,
                limit=limit,
                total=total,
                total_pages=ceil(total / limit) if total else 0,
            ),
        )

    async def list_admin(
        self,
        *,
        locale: str,
        page: int,
        limit: int,
        query: str | None,
        country_id: UUID | None,
        city_id: UUID | None,
        institution_type: str | None,
        status: str | None,
        maximum_rank: int | None,
        sort: UniversitySort,
    ) -> UniversityPage:
        return await self._list(
            locale=locale,
            page=page,
            limit=limit,
            public_only=False,
            query=query,
            country_id=country_id,
            city_id=city_id,
            institution_type=institution_type,
            status=status,
            maximum_rank=maximum_rank,
            sort=sort,
        )

    async def _list(self, **filters: Any) -> UniversityPage:
        rows, total = await self._repository.list_items(**filters)
        rows = await self._repository.hydrate_list(rows)
        return UniversityPage(
            data=[self._view(row, admin=False) for row in rows],
            meta=UniversityPageMeta(
                page=filters["page"],
                limit=filters["limit"],
                total=total,
                total_pages=ceil(total / filters["limit"]) if total else 0,
            ),
        )

    async def get_public(self, slug: str, locale: str) -> PublicUniversityView:
        row = await self._repository.get(locale=locale, slug=slug, public_only=True)
        if row is None:
            raise self._not_found()
        return self._public_view(row)

    async def get_admin(self, university_id: UUID, locale: str) -> UniversityView:
        row = await self._repository.get(locale=locale, university_id=university_id)
        if row is None:
            raise self._not_found()
        return self._view(row, admin=True)

    async def create(
        self, payload: dict[str, Any], actor_user_id: UUID, locale: str
    ) -> UniversityView:
        base, translations, rankings, media = await self._prepare(payload)
        try:
            university_id = await self._repository.create(base)
            await self._repository.replace_children(university_id, translations, rankings, media)
            row = await self._require(university_id, locale)
            await self._repository.audit(
                actor_user_id=actor_user_id,
                action="university.created",
                university_id=university_id,
                before=None,
                after=row,
            )
            await self._repository.session.commit()
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise self._conflict(exc) from exc
        return self._view(row, admin=True)

    async def update(
        self,
        university_id: UUID,
        payload: dict[str, Any],
        actor_user_id: UUID,
        expected_version: int,
        locale: str,
    ) -> UniversityView:
        before = await self._repository.get(locale=locale, university_id=university_id)
        if before is None:
            raise self._not_found()
        base, translations, rankings, media = await self._prepare(payload)
        if before["status"] == "published":
            self._ensure_publication_media({item["media_role"] for item in media})
        try:
            await self._repository.update_base(university_id, base, expected_version)
            await self._repository.replace_children(university_id, translations, rankings, media)
            row = await self._require(university_id, locale)
            await self._repository.audit(
                actor_user_id=actor_user_id,
                action="university.updated",
                university_id=university_id,
                before=before,
                after=row,
            )
            await self._repository.session.commit()
        except StaleUniversityError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise self._conflict(exc) from exc
        return self._view(row, admin=True)

    async def publish(
        self, university_id: UUID, actor_user_id: UUID, expected_version: int, locale: str
    ) -> UniversityView:
        before = await self._repository.get(locale=locale, university_id=university_id)
        if before is None:
            raise self._not_found()
        missing: list[str] = []
        if set(before["translations"]) != {"fa", "en"}:
            missing.append("translations")
        roles = {item["role"] for item in before["media"]}
        try:
            self._ensure_publication_media(roles)
        except ApplicationError as exc:
            missing.extend(exc.field_errors)
        if missing:
            raise ApplicationError(
                code="UNIVERSITY_INCOMPLETE",
                message="The university is not complete enough to publish.",
                status_code=422,
                field_errors={key: ["REQUIRED_FOR_PUBLICATION"] for key in missing},
            )
        try:
            await self._repository.publish(university_id, expected_version)
            row = await self._require(university_id, locale)
            await self._repository.audit(
                actor_user_id=actor_user_id,
                action="university.published",
                university_id=university_id,
                before=before,
                after=row,
            )
            await self._repository.session.commit()
        except StaleUniversityError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        return self._view(row, admin=True)

    @staticmethod
    def _ensure_publication_media(roles: set[str]) -> None:
        missing = [f"media.{role}" for role in ("logo", "hero") if role not in roles]
        if missing:
            raise ApplicationError(
                code="UNIVERSITY_INCOMPLETE",
                message="A published university requires a ready logo and hero image.",
                status_code=422,
                field_errors={key: ["REQUIRED_FOR_PUBLICATION"] for key in missing},
            )

    async def archive(
        self,
        university_id: UUID,
        reason: str,
        actor_user_id: UUID,
        expected_version: int,
        locale: str,
    ) -> UniversityView:
        before = await self._repository.get(locale=locale, university_id=university_id)
        if before is None:
            raise self._not_found()
        try:
            await self._repository.archive(university_id, actor_user_id, reason, expected_version)
            row = await self._require(university_id, locale)
            await self._repository.audit(
                actor_user_id=actor_user_id,
                action="university.archived",
                university_id=university_id,
                before=before,
                after=row,
            )
            await self._repository.session.commit()
        except StaleUniversityError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        return self._view(row, admin=True)

    async def delete_draft(
        self, university_id: UUID, actor_user_id: UUID, expected_version: int, locale: str
    ) -> None:
        before = await self._repository.get(locale=locale, university_id=university_id)
        if before is None:
            raise self._not_found()
        try:
            outcome = await self._repository.hard_delete_draft(university_id, expected_version)
            if outcome == "not_draft":
                raise ApplicationError(
                    "UNIVERSITY_DELETE_FORBIDDEN",
                    "Only a draft university can be permanently deleted; archive it instead.",
                    409,
                )
            if outcome == "dependent":
                raise ApplicationError(
                    "UNIVERSITY_HAS_DEPENDENCIES",
                    "This university has programs and cannot be permanently deleted.",
                    409,
                )
            await self._repository.audit(
                actor_user_id=actor_user_id,
                action="university.deleted",
                university_id=university_id,
                before=before,
                after=None,
            )
            await self._repository.session.commit()
        except StaleUniversityError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc

    async def _prepare(
        self, payload: dict[str, Any]
    ) -> tuple[
        dict[str, Any], dict[str, dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]
    ]:
        values = dict(payload)
        translations = values.pop("translations")
        rankings_payload = values.pop("rankings")
        media_payload = values.pop("media")
        tuition = values.pop("tuition")
        refs = await self._repository.reference_context(
            values["country_id"], values.get("city_id"), tuition.get("currency")
        )
        field_errors: dict[str, list[str]] = {}
        for key, exists in refs.items():
            if not exists:
                field_errors[
                    {"country": "countryId", "city": "cityId", "currency": "tuition.currency"}[key]
                ] = ["REFERENCE_NOT_FOUND"]
        asset_ids = [item["media_asset_id"] for item in media_payload]
        assets = await self._repository.media_context(asset_ids)
        for index, item in enumerate(media_payload):
            asset = assets.get(item["media_asset_id"])
            expected_purpose = (
                "logo" if item["role"] == UniversityMediaRole.LOGO else "university_image"
            )
            if asset is None or asset["upload_status"] != "ready":
                field_errors[f"media.{index}.mediaAssetId"] = ["MEDIA_NOT_READY"]
            elif asset["purpose"] != expected_purpose:
                field_errors[f"media.{index}.mediaAssetId"] = ["MEDIA_PURPOSE_MISMATCH"]
            elif not str(asset["mime_type"]).startswith("image/"):
                field_errors[f"media.{index}.mediaAssetId"] = ["IMAGE_REQUIRED"]
        if field_errors:
            raise ApplicationError(
                "UNIVERSITY_VALIDATION_FAILED",
                "One or more university references are invalid.",
                422,
                field_errors,
            )
        base = {
            **values,
            "institution_type": values["institution_type"].value
            if values.get("institution_type")
            else None,
            "tuition_mode": tuition["mode"].value,
            "tuition_min_minor": tuition.get("minimum_minor"),
            "tuition_max_minor": tuition.get("maximum_minor"),
            "tuition_currency": tuition.get("currency"),
        }
        rankings = [
            {
                "organization": item["organization"],
                "ranking_year": item["year"],
                "rank_value": item.get("rank"),
                "rank_band": item.get("band"),
                "source_url": item.get("source_url"),
            }
            for item in rankings_payload
        ]
        media = [
            {
                "media_asset_id": item["media_asset_id"],
                "media_role": item["role"].value,
                "display_order": item["display_order"],
            }
            for item in media_payload
        ]
        return base, translations, rankings, media

    async def _require(self, university_id: UUID, locale: str) -> dict[str, Any]:
        row = await self._repository.get(locale=locale, university_id=university_id)
        if row is None:
            raise RuntimeError("University unexpectedly disappeared")
        return row

    @staticmethod
    def _view(row: dict[str, Any], *, admin: bool) -> UniversityView:
        media: list[UniversityMediaView] = []
        for item in row.get("media", []):
            media.append(
                UniversityMediaView(
                    **item,
                    public_url=f"/api/v1/media/{item['media_asset_id']}/content",
                )
            )
        translations = None
        if admin:
            translations = {
                locale: UniversityTranslationView(**translation)
                for locale, translation in row.get("translations", {}).items()
            }
        return UniversityView(
            id=row["id"],
            slug=row["slug"],
            name=row["name"],
            short_description=row.get("short_description"),
            body=row.get("body"),
            seo_title=row.get("seo_title"),
            seo_description=row.get("seo_description"),
            country=ReferenceSummary(id=row["country_id"], name=row["country_name"]),
            city=(
                ReferenceSummary(id=row["city_id"], name=row["city_name"])
                if row.get("city_id") and row.get("city_name")
                else None
            ),
            institution_type=row.get("institution_type"),
            founded_year=row.get("founded_year"),
            website_url=row.get("website_url"),
            contact_email=row.get("contact_email"),
            contact_phone=row.get("contact_phone"),
            status=row["status"],
            featured=row["featured"],
            tuition=TuitionView(
                mode=row["tuition_mode"],
                minimum_minor=row.get("tuition_min_minor"),
                maximum_minor=row.get("tuition_max_minor"),
                currency=row.get("tuition_currency"),
            ),
            rankings=row.get("rankings", []),
            media=media,
            translations=translations,
            published_at=row.get("published_at"),
            archived_at=row.get("archived_at"),
            archived_by_user_id=row.get("archived_by_user_id"),
            archive_reason=row.get("archive_reason"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            version=row["row_version"],
        )

    @staticmethod
    def _public_view(row: dict[str, Any]) -> PublicUniversityView:
        media = [
            UniversityMediaView(
                **item,
                public_url=f"/api/v1/media/{item['media_asset_id']}/content",
            )
            for item in row.get("media", [])
            if item["role"] in {UniversityMediaRole.LOGO, UniversityMediaRole.HERO}
        ]
        return PublicUniversityView(
            id=row["id"],
            slug=row["slug"],
            name=row["name"],
            short_description=row.get("short_description"),
            country=ReferenceSummary(id=row["country_id"], name=row["country_name"]),
            city=(
                ReferenceSummary(id=row["city_id"], name=row["city_name"])
                if row.get("city_id") and row.get("city_name")
                else None
            ),
            institution_type=row.get("institution_type"),
            founded_year=row.get("founded_year"),
            website_url=row.get("website_url"),
            featured=row["featured"],
            media=media,
        )

    @staticmethod
    def _not_found() -> ApplicationError:
        return ApplicationError("UNIVERSITY_NOT_FOUND", "The university was not found.", 404)

    @staticmethod
    def _stale() -> ApplicationError:
        return ApplicationError(
            "STALE_WRITE", "The university changed after it was loaded. Reload and try again.", 412
        )

    @staticmethod
    def _conflict(exc: IntegrityError) -> ApplicationError:
        sqlstate = getattr(exc.orig, "sqlstate", None)
        if sqlstate == "23505":
            return ApplicationError(
                "UNIVERSITY_ALREADY_EXISTS",
                "A university with the same slug or ranking already exists.",
                409,
            )
        if sqlstate == "23503":
            return ApplicationError(
                "REFERENCE_NOT_FOUND",
                "A referenced country, city, currency, or media asset is missing.",
                422,
            )
        return ApplicationError(
            "UNIVERSITY_CONFLICT", "The university data conflicts with existing data.", 409
        )
