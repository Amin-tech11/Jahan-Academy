from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.exc import IntegrityError

from app.modules.catalog.domain import ReferenceKind, StaleReferenceDataError
from app.modules.catalog.repository import ReferenceDataRepository
from app.modules.catalog.schemas import ReferenceItemView, ReferencePage
from app.shared.exceptions import ApplicationError


class ReferenceDataService:
    def __init__(self, repository: ReferenceDataRepository) -> None:
        self._repository = repository

    async def list_public(
        self,
        kind: ReferenceKind,
        *,
        locale: str,
        page: int,
        limit: int,
        query: str | None = None,
        country_id: UUID | None = None,
        parent_id: UUID | None = None,
    ) -> ReferencePage:
        rows, total = await self._repository.list(
            kind,
            locale=locale,
            page=page,
            limit=limit,
            public_only=True,
            query=query,
            country_id=country_id,
            parent_id=parent_id,
        )
        return ReferencePage(
            data=[self._view(kind, row, admin=False) for row in rows],
            page=page,
            limit=limit,
            total=total,
        )

    async def list_admin(
        self,
        kind: ReferenceKind,
        *,
        locale: str,
        page: int,
        limit: int,
        query: str | None = None,
        country_id: UUID | None = None,
        parent_id: UUID | None = None,
    ) -> ReferencePage:
        rows, total = await self._repository.list(
            kind,
            locale=locale,
            page=page,
            limit=limit,
            public_only=False,
            query=query,
            country_id=country_id,
            parent_id=parent_id,
        )
        return ReferencePage(
            data=[self._view(kind, row, admin=False) for row in rows],
            page=page,
            limit=limit,
            total=total,
        )

    async def get_admin(self, kind: ReferenceKind, item_id: UUID) -> ReferenceItemView:
        item = await self._repository.get(kind, item_id)
        if item is None:
            raise self._not_found()
        return self._view(kind, item, admin=True)

    async def create(
        self, kind: ReferenceKind, payload: dict[str, Any], actor_user_id: UUID
    ) -> ReferenceItemView:
        values, translations = await self._prepare(kind, payload)
        try:
            item = await self._repository.create(kind, values, translations)
            await self._repository.audit(
                actor_user_id=actor_user_id,
                action="reference_data.created",
                kind=kind,
                item_id=item["id"],
                before=None,
                after=item,
            )
            await self._repository.session.commit()
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise self._conflict(exc) from exc
        return self._view(kind, item, admin=True)

    async def update(
        self,
        kind: ReferenceKind,
        item_id: UUID,
        payload: dict[str, Any],
        actor_user_id: UUID,
        expected_version: int,
    ) -> ReferenceItemView:
        values, translations = await self._prepare(kind, payload, item_id=item_id)
        before = await self._repository.get(kind, item_id)
        if before is None:
            raise self._not_found()
        try:
            item = await self._repository.update(
                kind, item_id, values, translations, expected_version
            )
            if item is None:
                raise RuntimeError("Updated reference-data item could not be reloaded")
            await self._repository.audit(
                actor_user_id=actor_user_id,
                action="reference_data.updated",
                kind=kind,
                item_id=item_id,
                before=before,
                after=item,
            )
            await self._repository.session.commit()
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise self._conflict(exc) from exc
        except StaleReferenceDataError as exc:
            await self._repository.session.rollback()
            raise self._precondition_failed() from exc
        return self._view(kind, item, admin=True)

    async def archive(
        self,
        kind: ReferenceKind,
        item_id: UUID,
        actor_user_id: UUID,
        expected_version: int,
    ) -> ReferenceItemView:
        before = await self._repository.get(kind, item_id)
        if before is None:
            raise self._not_found()
        try:
            item = await self._repository.archive(kind, item_id, expected_version)
        except StaleReferenceDataError as exc:
            await self._repository.session.rollback()
            raise self._precondition_failed() from exc
        if item is None:
            raise RuntimeError("Archived reference-data item could not be reloaded")
        await self._repository.audit(
            actor_user_id=actor_user_id,
            action="reference_data.archived",
            kind=kind,
            item_id=item_id,
            before=before,
            after=item,
        )
        await self._repository.session.commit()
        return self._view(kind, item, admin=True)

    async def _prepare(
        self, kind: ReferenceKind, payload: dict[str, Any], item_id: UUID | None = None
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        values = dict(payload)
        translations = values.pop("translations")
        if kind is ReferenceKind.CITIES:
            country_id = values["country_id"]
            if not await self._repository.exists(ReferenceKind.COUNTRIES, country_id):
                raise ApplicationError(
                    code="REFERENCE_NOT_FOUND",
                    message="The selected country does not exist.",
                    status_code=422,
                    field_errors={"countryId": ["REFERENCE_NOT_FOUND"]},
                )
            values["normalized_name"] = translations["en"]["name"].strip().casefold()
        if kind is ReferenceKind.FIELDS_OF_STUDY and values.get("parent_id"):
            parent_id = values["parent_id"]
            if item_id == parent_id:
                raise ApplicationError(
                    code="INVALID_PARENT",
                    message="A field of study cannot be its own parent.",
                    status_code=422,
                    field_errors={"parentId": ["SELF_REFERENCE"]},
                )
            if not await self._repository.exists(ReferenceKind.FIELDS_OF_STUDY, parent_id):
                raise ApplicationError(
                    code="REFERENCE_NOT_FOUND",
                    message="The selected parent field does not exist.",
                    status_code=422,
                    field_errors={"parentId": ["REFERENCE_NOT_FOUND"]},
                )
        return values, translations

    @staticmethod
    def _view(kind: ReferenceKind, item: dict[str, Any], *, admin: bool) -> ReferenceItemView:
        active = item.get("active", item.get("status") == "published")
        code = item.get("code") or item.get("iso2") or item.get("slug")
        translations = item.get("translations") if admin else None
        return ReferenceItemView(
            id=item["id"],
            type=kind.value,
            code=code,
            name=item.get("name", ""),
            description=item.get("description") or item.get("summary"),
            active=active,
            display_order=item.get("display_order", 0),
            version=item.get("row_version", 1),
            slug=item.get("slug"),
            country_id=item.get("country_id"),
            parent_id=item.get("parent_id"),
            iso2=item.get("iso2"),
            iso3=item.get("iso3"),
            status=item.get("status"),
            featured=item.get("featured"),
            numeric_code=item.get("numeric_code"),
            symbol=item.get("symbol"),
            decimal_places=item.get("decimal_places"),
            translations=translations,
            created_at=item.get("created_at"),
            updated_at=item.get("updated_at"),
        )

    @staticmethod
    def _not_found() -> ApplicationError:
        return ApplicationError(
            code="REFERENCE_DATA_NOT_FOUND",
            message="The reference-data item was not found.",
            status_code=404,
        )

    @staticmethod
    def _conflict(exc: IntegrityError) -> ApplicationError:
        sqlstate = getattr(exc.orig, "sqlstate", None)
        if sqlstate == "23505":
            return ApplicationError(
                code="REFERENCE_DATA_ALREADY_EXISTS",
                message="A reference-data item with the same unique value already exists.",
                status_code=409,
            )
        if sqlstate == "23503":
            return ApplicationError(
                code="REFERENCE_NOT_FOUND",
                message="A referenced item does not exist.",
                status_code=422,
            )
        return ApplicationError(
            code="REFERENCE_DATA_CONFLICT",
            message="The reference-data item conflicts with existing data.",
            status_code=409,
        )

    @staticmethod
    def _precondition_failed() -> ApplicationError:
        return ApplicationError(
            code="STALE_WRITE",
            message="The item changed after it was loaded. Reload it and try again.",
            status_code=412,
        )
