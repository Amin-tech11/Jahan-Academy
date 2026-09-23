from __future__ import annotations

from typing import Any
from uuid import uuid4

import pytest

from app.modules.discovery.domain import DiscoveryEntityType
from app.modules.discovery.service import DiscoveryService
from app.shared.exceptions import ApplicationError


class FakeDiscoveryRepository:
    async def suggestions(self, **_: Any) -> list[dict[str, Any]]:
        return [
            {
                "entity_type": "program",
                "id": uuid4(),
                "slug": "computer-science",
                "title": "Computer Science",
                "subtitle": "Jahan University",
                "score": 5.123456,
            }
        ]

    async def published_slug_exists(self, **values: Any) -> bool:
        return values["slug"] != "missing"

    async def related_universities(self, **_: Any) -> list[dict[str, Any]]:
        return [
            {
                "entity_type": "university",
                "id": uuid4(),
                "slug": "related-university",
                "title": "Related University",
                "subtitle": "Germany",
                "score": 8.5,
                "same_country": True,
                "same_city": False,
                "same_type": True,
                "shared_fields": 1,
                "featured": False,
            }
        ]

    async def related_programs(self, **_: Any) -> list[dict[str, Any]]:
        return []


@pytest.mark.asyncio
async def test_suggestions_normalize_query_and_round_score() -> None:
    service = DiscoveryService(FakeDiscoveryRepository())  # type: ignore[arg-type]

    result = await service.suggest(
        query="  Computer   Science ", locale="en", entity_type=None, limit=8
    )

    assert result.query == "Computer Science"
    assert result.data[0].entity_type is DiscoveryEntityType.PROGRAM
    assert result.data[0].score == 5.1235


@pytest.mark.asyncio
async def test_related_results_explain_their_score() -> None:
    service = DiscoveryService(FakeDiscoveryRepository())  # type: ignore[arg-type]

    result = await service.related(
        entity=DiscoveryEntityType.UNIVERSITY,
        slug="source-university",
        locale="en",
        limit=6,
    )

    assert result.data[0].reasons == [
        "same_country",
        "same_institution_type",
        "shared_fields",
    ]


@pytest.mark.asyncio
async def test_related_missing_source_is_not_found() -> None:
    service = DiscoveryService(FakeDiscoveryRepository())  # type: ignore[arg-type]

    with pytest.raises(ApplicationError) as error:
        await service.related(
            entity=DiscoveryEntityType.PROGRAM, slug="missing", locale="fa", limit=6
        )

    assert error.value.code == "DISCOVERY_SOURCE_NOT_FOUND"
