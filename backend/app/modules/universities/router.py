from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import database_session
from app.modules.identity.authorization import AuthorizationContext
from app.modules.identity.dependencies import require_permissions
from app.modules.universities.domain import InstitutionType, UniversitySort, UniversityStatus
from app.modules.universities.repository import UniversityRepository
from app.modules.universities.schemas import (
    ArchiveUniversityRequest,
    UniversityEnvelope,
    UniversityPage,
    UniversityWrite,
)
from app.modules.universities.service import UniversityService
from app.shared.exceptions import ApplicationError

router = APIRouter(tags=["universities"])
public_router = APIRouter(prefix="/universities")
admin_router = APIRouter(prefix="/admin/universities", tags=["university-administration"])


def university_service(
    session: Annotated[AsyncSession, Depends(database_session)],
) -> UniversityService:
    return UniversityService(UniversityRepository(session))


@public_router.get(
    "",
    response_model=UniversityPage,
    response_model_exclude_none=True,
    summary="Discover published universities",
)
async def list_public_universities(
    service: Annotated[UniversityService, Depends(university_service)],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=20)] = 20,
    q: Annotated[str | None, Query(min_length=2, max_length=100)] = None,
    country_id: Annotated[UUID | None, Query(alias="countryId")] = None,
    city_id: Annotated[UUID | None, Query(alias="cityId")] = None,
    institution_type: Annotated[InstitutionType | None, Query(alias="type")] = None,
    maximum_rank: Annotated[int | None, Query(alias="maximumRank", gt=0)] = None,
    sort: UniversitySort = UniversitySort.FEATURED,
) -> UniversityPage:
    return await service.list_public(
        locale=locale,
        page=page,
        limit=limit,
        query=q,
        country_id=country_id,
        city_id=city_id,
        institution_type=institution_type.value if institution_type else None,
        maximum_rank=maximum_rank,
        sort=sort,
    )


@public_router.get(
    "/{slug}",
    response_model=UniversityEnvelope,
    response_model_exclude_none=True,
    summary="View a published university",
)
async def get_public_university(
    slug: str,
    service: Annotated[UniversityService, Depends(university_service)],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> UniversityEnvelope:
    return UniversityEnvelope(data=await service.get_public(slug, locale))


@admin_router.get("", response_model=UniversityPage, summary="Search all universities")
async def list_admin_universities(
    service: Annotated[UniversityService, Depends(university_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("catalog.read"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    q: Annotated[str | None, Query(min_length=2, max_length=100)] = None,
    country_id: Annotated[UUID | None, Query(alias="countryId")] = None,
    city_id: Annotated[UUID | None, Query(alias="cityId")] = None,
    institution_type: Annotated[InstitutionType | None, Query(alias="type")] = None,
    university_status: Annotated[UniversityStatus | None, Query(alias="status")] = None,
    maximum_rank: Annotated[int | None, Query(alias="maximumRank", gt=0)] = None,
    sort: UniversitySort = UniversitySort.UPDATED_DESC,
) -> UniversityPage:
    return await service.list_admin(
        locale=locale,
        page=page,
        limit=limit,
        query=q,
        country_id=country_id,
        city_id=city_id,
        institution_type=institution_type.value if institution_type else None,
        status=university_status.value if university_status else None,
        maximum_rank=maximum_rank,
        sort=sort,
    )


@admin_router.post(
    "",
    response_model=UniversityEnvelope,
    status_code=status.HTTP_201_CREATED,
    summary="Create a bilingual university draft",
)
async def create_university(
    payload: UniversityWrite,
    response: Response,
    service: Annotated[UniversityService, Depends(university_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("catalog.write"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> UniversityEnvelope:
    item = await service.create(payload.model_dump(mode="python"), actor.user_id, locale)
    response.headers["ETag"] = _etag(item.version)
    return UniversityEnvelope(data=item)


@admin_router.get(
    "/{university_id}", response_model=UniversityEnvelope, summary="View one university draft"
)
async def get_admin_university(
    university_id: UUID,
    response: Response,
    service: Annotated[UniversityService, Depends(university_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("catalog.read"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> UniversityEnvelope:
    item = await service.get_admin(university_id, locale)
    response.headers["ETag"] = _etag(item.version)
    return UniversityEnvelope(data=item)


@admin_router.put(
    "/{university_id}", response_model=UniversityEnvelope, summary="Replace a university"
)
async def update_university(
    university_id: UUID,
    payload: UniversityWrite,
    response: Response,
    service: Annotated[UniversityService, Depends(university_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("catalog.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> UniversityEnvelope:
    item = await service.update(
        university_id,
        payload.model_dump(mode="python"),
        actor.user_id,
        _parse_if_match(if_match),
        locale,
    )
    response.headers["ETag"] = _etag(item.version)
    return UniversityEnvelope(data=item)


@admin_router.post(
    "/{university_id}/publish",
    response_model=UniversityEnvelope,
    summary="Publish a complete university",
)
async def publish_university(
    university_id: UUID,
    response: Response,
    service: Annotated[UniversityService, Depends(university_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("catalog.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> UniversityEnvelope:
    item = await service.publish(university_id, actor.user_id, _parse_if_match(if_match), locale)
    response.headers["ETag"] = _etag(item.version)
    return UniversityEnvelope(data=item)


@admin_router.post(
    "/{university_id}/archive",
    response_model=UniversityEnvelope,
    summary="Archive a university without losing relations",
)
async def archive_university(
    university_id: UUID,
    payload: ArchiveUniversityRequest,
    response: Response,
    service: Annotated[UniversityService, Depends(university_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("catalog.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> UniversityEnvelope:
    item = await service.archive(
        university_id, payload.reason, actor.user_id, _parse_if_match(if_match), locale
    )
    response.headers["ETag"] = _etag(item.version)
    return UniversityEnvelope(data=item)


@admin_router.delete(
    "/{university_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an unused draft"
)
async def delete_university(
    university_id: UUID,
    service: Annotated[UniversityService, Depends(university_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("catalog.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> Response:
    await service.delete_draft(university_id, actor.user_id, _parse_if_match(if_match), locale)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _etag(version: int) -> str:
    return f'"{version}"'


def _parse_if_match(value: str | None) -> int:
    if value is None:
        raise ApplicationError(
            "PRECONDITION_REQUIRED", "If-Match is required for this operation.", 428
        )
    normalized = value.strip().removeprefix("W/").strip('"')
    if not normalized.isdigit() or int(normalized) < 1:
        raise ApplicationError("INVALID_IF_MATCH", "If-Match must contain a valid version.", 400)
    return int(normalized)


router.include_router(public_router)
router.include_router(admin_router)
