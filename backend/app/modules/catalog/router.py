from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import database_session
from app.modules.catalog.domain import ReferenceKind
from app.modules.catalog.repository import ReferenceDataRepository
from app.modules.catalog.schemas import (
    AcademicLevelWrite,
    CityWrite,
    CountryWrite,
    CurrencyWrite,
    FieldOfStudyWrite,
    IntakeWrite,
    ReferenceItemEnvelope,
    ReferencePage,
)
from app.modules.catalog.service import ReferenceDataService
from app.modules.identity.authorization import AuthorizationContext
from app.modules.identity.dependencies import require_permissions
from app.shared.exceptions import ApplicationError

router = APIRouter(tags=["reference-data"])
public_router = APIRouter(prefix="/reference-data")
admin_router = APIRouter(prefix="/admin/reference-data")

type ReferenceWrite = (
    CountryWrite | CityWrite | FieldOfStudyWrite | IntakeWrite | AcademicLevelWrite | CurrencyWrite
)

PAYLOAD_TYPES: dict[ReferenceKind, type[ReferenceWrite]] = {
    ReferenceKind.COUNTRIES: CountryWrite,
    ReferenceKind.CITIES: CityWrite,
    ReferenceKind.ACADEMIC_LEVELS: AcademicLevelWrite,
    ReferenceKind.FIELDS_OF_STUDY: FieldOfStudyWrite,
    ReferenceKind.INTAKES: IntakeWrite,
    ReferenceKind.CURRENCIES: CurrencyWrite,
}


def reference_service(
    session: Annotated[AsyncSession, Depends(database_session)],
) -> ReferenceDataService:
    return ReferenceDataService(ReferenceDataRepository(session))


@public_router.get(
    "/{kind}",
    response_model=ReferencePage,
    response_model_exclude_none=True,
    summary="List active localized reference data",
)
async def list_public_reference_data(
    kind: ReferenceKind,
    service: Annotated[ReferenceDataService, Depends(reference_service)],
    locale: Annotated[str, Query(pattern="^(fa|en)$")] = "fa",
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    q: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    country_id: UUID | None = None,
    parent_id: UUID | None = None,
) -> ReferencePage:
    return await service.list_public(
        kind,
        locale=locale,
        page=page,
        limit=limit,
        query=q,
        country_id=country_id,
        parent_id=parent_id,
    )


@router.get(
    "/countries",
    response_model=ReferencePage,
    response_model_exclude_none=True,
    include_in_schema=False,
)
async def list_public_countries_alias(
    service: Annotated[ReferenceDataService, Depends(reference_service)],
    locale: Annotated[str, Query(pattern="^(fa|en)$")] = "fa",
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    q: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
) -> ReferencePage:
    return await service.list_public(
        ReferenceKind.COUNTRIES,
        locale=locale,
        page=page,
        limit=limit,
        query=q,
    )


@admin_router.get(
    "/{kind}",
    response_model=ReferencePage,
    response_model_exclude_none=True,
    summary="List reference data for administration",
)
async def list_admin_reference_data(
    kind: ReferenceKind,
    service: Annotated[ReferenceDataService, Depends(reference_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("reference_data.read"))],
    locale: Annotated[str, Query(pattern="^(fa|en)$")] = "fa",
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    q: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    country_id: UUID | None = None,
    parent_id: UUID | None = None,
) -> ReferencePage:
    return await service.list_admin(
        kind,
        locale=locale,
        page=page,
        limit=limit,
        query=q,
        country_id=country_id,
        parent_id=parent_id,
    )


@admin_router.post(
    "/{kind}",
    response_model=ReferenceItemEnvelope,
    response_model_exclude_none=True,
    status_code=status.HTTP_201_CREATED,
    summary="Create a bilingual reference-data item",
)
async def create_reference_data(
    kind: ReferenceKind,
    payload: ReferenceWrite,
    response: Response,
    service: Annotated[ReferenceDataService, Depends(reference_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("reference_data.write"))],
) -> ReferenceItemEnvelope:
    _validate_payload_type(kind, payload)
    item = await service.create(kind, payload.model_dump(mode="python"), actor.user_id)
    response.headers["ETag"] = _etag(item.version)
    return ReferenceItemEnvelope(data=item)


@admin_router.get(
    "/{kind}/{item_id}",
    response_model=ReferenceItemEnvelope,
    response_model_exclude_none=True,
    summary="Get one reference-data item with both translations",
)
async def get_reference_data(
    kind: ReferenceKind,
    item_id: UUID,
    response: Response,
    service: Annotated[ReferenceDataService, Depends(reference_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("reference_data.read"))],
) -> ReferenceItemEnvelope:
    item = await service.get_admin(kind, item_id)
    response.headers["ETag"] = _etag(item.version)
    return ReferenceItemEnvelope(data=item)


@admin_router.put(
    "/{kind}/{item_id}",
    response_model=ReferenceItemEnvelope,
    response_model_exclude_none=True,
    summary="Replace a bilingual reference-data item",
)
async def update_reference_data(
    kind: ReferenceKind,
    item_id: UUID,
    payload: ReferenceWrite,
    response: Response,
    service: Annotated[ReferenceDataService, Depends(reference_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("reference_data.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
) -> ReferenceItemEnvelope:
    _validate_payload_type(kind, payload)
    item = await service.update(
        kind,
        item_id,
        payload.model_dump(mode="python"),
        actor.user_id,
        _parse_if_match(if_match),
    )
    response.headers["ETag"] = _etag(item.version)
    return ReferenceItemEnvelope(data=item)


@admin_router.delete(
    "/{kind}/{item_id}",
    response_model=ReferenceItemEnvelope,
    response_model_exclude_none=True,
    summary="Archive a reference-data item",
)
async def archive_reference_data(
    kind: ReferenceKind,
    item_id: UUID,
    response: Response,
    service: Annotated[ReferenceDataService, Depends(reference_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("reference_data.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
) -> ReferenceItemEnvelope:
    item = await service.archive(kind, item_id, actor.user_id, _parse_if_match(if_match))
    response.headers["ETag"] = _etag(item.version)
    return ReferenceItemEnvelope(data=item)


def _validate_payload_type(kind: ReferenceKind, payload: ReferenceWrite) -> None:
    expected = PAYLOAD_TYPES[kind]
    if not isinstance(payload, expected):
        raise ApplicationError(
            code="REFERENCE_DATA_SCHEMA_MISMATCH",
            message=f"The request body is not valid for {kind.value}.",
            status_code=422,
        )


def _etag(version: int) -> str:
    return f'"{version}"'


def _parse_if_match(value: str | None) -> int:
    if value is None:
        raise ApplicationError(
            code="PRECONDITION_REQUIRED",
            message="If-Match is required for this operation.",
            status_code=428,
        )
    normalized = value.strip()
    if normalized.startswith("W/"):
        normalized = normalized[2:]
    normalized = normalized.strip('"')
    if not normalized.isdigit() or int(normalized) < 1:
        raise ApplicationError(
            code="INVALID_IF_MATCH",
            message="If-Match must contain a valid item version.",
            status_code=400,
        )
    return int(normalized)


router.include_router(public_router)
router.include_router(admin_router)
