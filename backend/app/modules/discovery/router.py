from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import database_session
from app.modules.discovery.domain import DiscoveryEntityType
from app.modules.discovery.repository import DiscoveryRepository
from app.modules.discovery.schemas import RelatedEnvelope, SuggestionEnvelope
from app.modules.discovery.service import DiscoveryService

router = APIRouter(tags=["discovery"])


def discovery_service(
    session: Annotated[AsyncSession, Depends(database_session)],
) -> DiscoveryService:
    return DiscoveryService(DiscoveryRepository(session))


@router.get(
    "/discovery/suggestions",
    response_model=SuggestionEnvelope,
    summary="Suggest published universities and programs",
)
async def suggestions(
    service: Annotated[DiscoveryService, Depends(discovery_service)],
    q: Annotated[str, Query(min_length=2, max_length=100)],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
    entity_type: Annotated[DiscoveryEntityType | None, Query(alias="entityType")] = None,
    limit: Annotated[int, Query(ge=1, le=10)] = 8,
) -> SuggestionEnvelope:
    return await service.suggest(query=q, locale=locale, entity_type=entity_type, limit=limit)


@router.get(
    "/universities/{slug}/related",
    response_model=RelatedEnvelope,
    summary="Find related published universities",
)
async def related_universities(
    slug: str,
    service: Annotated[DiscoveryService, Depends(discovery_service)],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
    limit: Annotated[int, Query(ge=1, le=12)] = 6,
) -> RelatedEnvelope:
    return await service.related(
        entity=DiscoveryEntityType.UNIVERSITY, slug=slug, locale=locale, limit=limit
    )


@router.get(
    "/programs/{slug}/related",
    response_model=RelatedEnvelope,
    summary="Find related published academic programs",
)
async def related_programs(
    slug: str,
    service: Annotated[DiscoveryService, Depends(discovery_service)],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
    limit: Annotated[int, Query(ge=1, le=12)] = 6,
) -> RelatedEnvelope:
    return await service.related(
        entity=DiscoveryEntityType.PROGRAM, slug=slug, locale=locale, limit=limit
    )
