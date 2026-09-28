from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1", reason="requires migrated PostgreSQL"
)


def test_listing_metadata_uses_noindex_for_any_filter_and_robots_is_public() -> None:
    with TestClient(app) as client:
        filtered = client.get(
            "/api/v1/seo/listings/universities/metadata", params={"locale": "fa", "q": "data"}
        )
        unfiltered = client.get(
            "/api/v1/seo/listings/universities/metadata", params={"locale": "fa"}
        )
        robots = client.get("/robots.txt")

    assert filtered.status_code == 200
    assert filtered.json()["robots"] == "noindex,follow"
    assert filtered.json()["canonical"].endswith("/fa/universities")
    assert unfiltered.status_code == 200
    assert unfiltered.json()["robots"] == "index,follow"
    assert robots.status_code == 200
    assert "Disallow: /api/" in robots.text
