from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import database_session
from app.modules.experience.repository import ExperienceRepository
from app.modules.experience.schemas import (
    ArchiveExperienceRequest,
    CountryGuideEnvelope,
    CountryGuidePage,
    CountryGuideWrite,
    PageEnvelope,
    PublicPageList,
    PublicPageWrite,
)
from app.modules.experience.service import ExperienceService
from app.modules.identity.authorization import AuthorizationContext
from app.modules.identity.dependencies import require_permissions
from app.shared.exceptions import ApplicationError

router = APIRouter(tags=["public-experience"])
public_router = APIRouter(prefix="/public", tags=["public-experience"])
admin_page_router = APIRouter(
    prefix="/admin/public-pages", tags=["public-experience-administration"]
)
admin_guide_router = APIRouter(
    prefix="/admin/country-guides", tags=["public-experience-administration"]
)


def experience_service(
    session: Annotated[AsyncSession, Depends(database_session)],
) -> ExperienceService:
    return ExperienceService(ExperienceRepository(session))


@public_router.get("/home", response_model=PageEnvelope, response_model_exclude_none=True)
async def home(
    service: Annotated[ExperienceService, Depends(experience_service)],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> PageEnvelope:
    return PageEnvelope(data=await service.home(locale))


@public_router.get("/pages/{slug}", response_model=PageEnvelope, response_model_exclude_none=True)
async def public_page(
    slug: str,
    service: Annotated[ExperienceService, Depends(experience_service)],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> PageEnvelope:
    return PageEnvelope(data=await service.public_page(slug, locale))


@public_router.get(
    "/country-guides", response_model=CountryGuidePage, response_model_exclude_none=True
)
async def list_country_guides(
    service: Annotated[ExperienceService, Depends(experience_service)],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> CountryGuidePage:
    return CountryGuidePage(data=await service.list_guides(locale))


@public_router.get(
    "/country-guides/{country_slug}",
    response_model=CountryGuideEnvelope,
    response_model_exclude_none=True,
)
async def public_country_guide(
    country_slug: str,
    service: Annotated[ExperienceService, Depends(experience_service)],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> CountryGuideEnvelope:
    return CountryGuideEnvelope(data=await service.public_guide(country_slug, locale))


@admin_page_router.post("", response_model=PageEnvelope, status_code=status.HTTP_201_CREATED)
async def create_page(
    payload: PublicPageWrite,
    response: Response,
    service: Annotated[ExperienceService, Depends(experience_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.write"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> PageEnvelope:
    page = await service.create_page(payload.model_dump(mode="json"), actor.user_id, locale)
    response.headers["ETag"] = _etag(page.version)
    return PageEnvelope(data=page)


@admin_page_router.get("", response_model=PublicPageList)
async def list_pages(
    service: Annotated[ExperienceService, Depends(experience_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("content.read"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> PublicPageList:
    return PublicPageList(data=await service.list_admin_pages(locale))


@admin_page_router.get("/{page_id}", response_model=PageEnvelope)
async def get_page(
    page_id: UUID,
    response: Response,
    service: Annotated[ExperienceService, Depends(experience_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("content.read"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> PageEnvelope:
    page = await service.admin_page(page_id, locale)
    response.headers["ETag"] = _etag(page.version)
    return PageEnvelope(data=page)


@admin_page_router.put("/{page_id}", response_model=PageEnvelope)
async def update_page(
    page_id: UUID,
    payload: PublicPageWrite,
    response: Response,
    service: Annotated[ExperienceService, Depends(experience_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> PageEnvelope:
    page = await service.update_page(
        page_id, payload.model_dump(mode="json"), actor.user_id, _parse_if_match(if_match), locale
    )
    response.headers["ETag"] = _etag(page.version)
    return PageEnvelope(data=page)


@admin_page_router.post("/{page_id}/publish", response_model=PageEnvelope)
async def publish_page(
    page_id: UUID,
    response: Response,
    service: Annotated[ExperienceService, Depends(experience_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.publish"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> PageEnvelope:
    page = await service.publish_page(page_id, actor.user_id, _parse_if_match(if_match), locale)
    response.headers["ETag"] = _etag(page.version)
    return PageEnvelope(data=page)


@admin_page_router.post("/{page_id}/archive", response_model=PageEnvelope)
async def archive_page(
    page_id: UUID,
    payload: ArchiveExperienceRequest,
    response: Response,
    service: Annotated[ExperienceService, Depends(experience_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.publish"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> PageEnvelope:
    page = await service.archive_page(
        page_id, payload.reason, actor.user_id, _parse_if_match(if_match), locale
    )
    response.headers["ETag"] = _etag(page.version)
    return PageEnvelope(data=page)


@admin_guide_router.get("", response_model=CountryGuidePage)
async def list_guides(
    service: Annotated[ExperienceService, Depends(experience_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("content.read"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> CountryGuidePage:
    return CountryGuidePage(data=await service.list_admin_guides(locale))


@admin_guide_router.post(
    "", response_model=CountryGuideEnvelope, status_code=status.HTTP_201_CREATED
)
async def create_guide(
    payload: CountryGuideWrite,
    response: Response,
    service: Annotated[ExperienceService, Depends(experience_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.write"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> CountryGuideEnvelope:
    guide = await service.create_guide(payload.model_dump(mode="json"), actor.user_id, locale)
    response.headers["ETag"] = _etag(guide.version)
    return CountryGuideEnvelope(data=guide)


@admin_guide_router.get("/{guide_id}", response_model=CountryGuideEnvelope)
async def get_guide(
    guide_id: UUID,
    response: Response,
    service: Annotated[ExperienceService, Depends(experience_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("content.read"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> CountryGuideEnvelope:
    guide = await service.admin_guide(guide_id, locale)
    response.headers["ETag"] = _etag(guide.version)
    return CountryGuideEnvelope(data=guide)


@admin_guide_router.put("/{guide_id}", response_model=CountryGuideEnvelope)
async def update_guide(
    guide_id: UUID,
    payload: CountryGuideWrite,
    response: Response,
    service: Annotated[ExperienceService, Depends(experience_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> CountryGuideEnvelope:
    guide = await service.update_guide(
        guide_id, payload.model_dump(mode="json"), actor.user_id, _parse_if_match(if_match), locale
    )
    response.headers["ETag"] = _etag(guide.version)
    return CountryGuideEnvelope(data=guide)


@admin_guide_router.post("/{guide_id}/publish", response_model=CountryGuideEnvelope)
async def publish_guide(
    guide_id: UUID,
    response: Response,
    service: Annotated[ExperienceService, Depends(experience_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.publish"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> CountryGuideEnvelope:
    guide = await service.publish_guide(guide_id, actor.user_id, _parse_if_match(if_match), locale)
    response.headers["ETag"] = _etag(guide.version)
    return CountryGuideEnvelope(data=guide)


@admin_guide_router.post("/{guide_id}/archive", response_model=CountryGuideEnvelope)
async def archive_guide(
    guide_id: UUID,
    payload: ArchiveExperienceRequest,
    response: Response,
    service: Annotated[ExperienceService, Depends(experience_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.publish"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> CountryGuideEnvelope:
    guide = await service.archive_guide(
        guide_id, payload.reason, actor.user_id, _parse_if_match(if_match), locale
    )
    response.headers["ETag"] = _etag(guide.version)
    return CountryGuideEnvelope(data=guide)


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
router.include_router(admin_page_router)
router.include_router(admin_guide_router)
