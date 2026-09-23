from __future__ import annotations

from typing import Any

from app.modules.discovery.domain import DiscoveryEntityType
from app.modules.discovery.repository import DiscoveryRepository
from app.modules.discovery.schemas import (
    DiscoverySuggestion,
    RelatedEnvelope,
    RelatedResult,
    SuggestionEnvelope,
)
from app.shared.exceptions import ApplicationError


class DiscoveryService:
    def __init__(self, repository: DiscoveryRepository) -> None:
        self._repository = repository

    async def suggest(
        self,
        *,
        query: str,
        locale: str,
        entity_type: DiscoveryEntityType | None,
        limit: int,
    ) -> SuggestionEnvelope:
        normalized = " ".join(query.split())
        rows = await self._repository.suggestions(
            query=normalized, locale=locale, entity_type=entity_type, limit=limit
        )
        return SuggestionEnvelope(
            data=[DiscoverySuggestion(**self._base(row)) for row in rows],
            query=normalized,
            locale=locale,
        )

    async def related(
        self, *, entity: DiscoveryEntityType, slug: str, locale: str, limit: int
    ) -> RelatedEnvelope:
        if not await self._repository.published_slug_exists(entity=entity, slug=slug):
            raise ApplicationError(
                "DISCOVERY_SOURCE_NOT_FOUND", "Published item was not found.", 404
            )
        if entity is DiscoveryEntityType.UNIVERSITY:
            rows = await self._repository.related_universities(
                slug=slug, locale=locale, limit=limit
            )
        else:
            rows = await self._repository.related_programs(slug=slug, locale=locale, limit=limit)
        return RelatedEnvelope(
            data=[
                RelatedResult(
                    **self._base(row),
                    reasons=self._university_reasons(row)
                    if entity is DiscoveryEntityType.UNIVERSITY
                    else self._program_reasons(row),
                )
                for row in rows
            ],
            locale=locale,
        )

    @staticmethod
    def _base(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "entity_type": row.get("entity_type", "university"),
            "id": row["id"],
            "slug": row["slug"],
            "title": row["title"],
            "subtitle": row.get("subtitle"),
            "score": round(float(row["score"]), 4),
        }

    @staticmethod
    def _university_reasons(row: dict[str, Any]) -> list[str]:
        reasons = []
        if row["same_country"]:
            reasons.append("same_country")
        if row["same_city"]:
            reasons.append("same_city")
        if row["same_type"]:
            reasons.append("same_institution_type")
        if row["shared_fields"]:
            reasons.append("shared_fields")
        if row["featured"]:
            reasons.append("featured")
        return reasons

    @staticmethod
    def _program_reasons(row: dict[str, Any]) -> list[str]:
        reasons = []
        if row["same_university"]:
            reasons.append("same_university")
        if row["same_level"]:
            reasons.append("same_level")
        if row["shared_fields"]:
            reasons.append("shared_fields")
        if row["same_language"]:
            reasons.append("same_teaching_language")
        if row["same_currency"]:
            reasons.append("same_currency")
        if row["featured"]:
            reasons.append("featured")
        return reasons
