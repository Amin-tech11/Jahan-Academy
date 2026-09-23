from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.discovery.domain import DiscoveryEntityType


def _to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class DiscoveryModel(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True, extra="forbid")


class DiscoverySuggestion(DiscoveryModel):
    entity_type: DiscoveryEntityType
    id: UUID
    slug: str
    title: str
    subtitle: str | None = None
    score: float = Field(ge=0)


class SuggestionEnvelope(DiscoveryModel):
    data: list[DiscoverySuggestion]
    query: str
    locale: str


class RelatedResult(DiscoverySuggestion):
    reasons: list[str]


class RelatedEnvelope(DiscoveryModel):
    data: list[RelatedResult]
    locale: str
