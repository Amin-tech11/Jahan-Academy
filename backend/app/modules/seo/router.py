from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import database_session
from app.core.config import get_settings
from app.modules.seo.repository import SeoRepository
from app.modules.seo.schemas import SeoListing, SeoMetadata, SeoResource
from app.modules.seo.service import SeoService
from app.shared.exceptions import ApplicationError

router = APIRouter(prefix="/seo", tags=["seo"])
public_site_router = APIRouter(include_in_schema=False)


def seo_service() -> SeoService:
    return SeoService(get_settings().frontend_url)


@router.get("/entities/{resource}/{slug}/metadata", response_model=SeoMetadata)
async def get_entity_metadata(
    resource: SeoResource,
    slug: str,
    session: Annotated[AsyncSession, Depends(database_session)],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> SeoMetadata:
    if not slug.replace("-", "").isalnum():
        raise ApplicationError("NOT_FOUND", "The requested SEO resource was not found.", 404)
    row = await SeoRepository(session).get_entity(resource, slug, locale)
    if row is None:
        raise ApplicationError("NOT_FOUND", "The requested SEO resource was not found.", 404)
    return seo_service().entity_metadata(resource=resource, slug=slug, locale=locale, **row)


@router.get("/listings/{resource}/metadata", response_model=SeoMetadata)
async def get_listing_metadata(
    resource: SeoListing,
    request: Request,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> SeoMetadata:
    filtered = any(key != "locale" for key in request.query_params)
    return seo_service().listing_metadata(resource=resource, locale=locale, filtered=filtered)


@public_site_router.get("/sitemap.xml", response_class=Response)
async def sitemap(session: Annotated[AsyncSession, Depends(database_session)]) -> Response:
    service = seo_service()
    rows = await SeoRepository(session).sitemap_entries()
    entries = [
        {
            "loc": service.url_for(row["resource"], row["slug"], row["locale"]),
            "last_modified": row["updated_at"],
        }
        for row in rows
    ]
    return Response(content=service.sitemap_xml(entries), media_type="application/xml")


@public_site_router.get("/robots.txt", response_class=PlainTextResponse)
async def robots() -> PlainTextResponse:
    return PlainTextResponse(seo_service().robots_txt())
