from __future__ import annotations

import os
from typing import Any
from uuid import UUID, uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.identity.authorization import AuthorizationContext, RoleGrant
from app.modules.identity.dependencies import authorization_context

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1",
    reason="requires migrated PostgreSQL",
)


def _sync_database_url() -> str:
    url = os.environ["JAHAN_DATABASE_URL"]
    return url.replace("postgresql+asyncpg://", "postgresql://")


def _create_actor() -> UUID:
    actor_id = uuid4()
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO users (id, status, preferred_locale) VALUES (%s, 'active', 'fa')",
            (actor_id,),
        )
    return actor_id


def _remove_actor(actor_id: UUID) -> None:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute("DELETE FROM users WHERE id = %s", (actor_id,))


def _remove_country(country_id: UUID) -> None:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute("DELETE FROM countries WHERE id = %s", (country_id,))


def test_reference_data_admin_and_public_lifecycle() -> None:
    actor_id = _create_actor()
    context = AuthorizationContext(
        user_id=actor_id,
        grants=(
            RoleGrant(
                role="super_admin",
                scope_type="global",
                scope_id=None,
                permissions=frozenset({"reference_data.read", "reference_data.write"}),
            ),
        ),
    )

    async def context_override() -> AuthorizationContext:
        return context

    app.dependency_overrides[authorization_context] = context_override
    unique = uuid4().hex[:8]
    country_id: UUID | None = None
    country_payload: dict[str, Any] = {
        "iso2": "XZ",
        "iso3": "XZZ",
        "slug": f"test-country-{unique}",
        "status": "published",
        "featured": True,
        "displayOrder": 15,
        "translations": {
            "fa": {"name": f"کشور آزمایشی {unique}", "description": "توضیح فارسی"},
            "en": {"name": f"Test Country {unique}", "description": "English text"},
        },
    }

    try:
        with TestClient(app) as client:
            created = client.post("/api/v1/admin/reference-data/countries", json=country_payload)
            assert created.status_code == 201, created.text
            country_id = UUID(created.json()["data"]["id"])
            initial_etag = created.headers["etag"]
            assert created.json()["data"]["translations"]["fa"]["name"].startswith("کشور")

            public_fa = client.get(
                "/api/v1/reference-data/countries",
                params={"locale": "fa", "q": unique},
            )
            assert public_fa.status_code == 200
            assert public_fa.json()["total"] == 1
            assert public_fa.json()["data"][0]["name"].endswith(unique)

            public_en = client.get(
                "/api/v1/reference-data/countries",
                params={"locale": "en", "q": unique},
            )
            assert public_en.json()["data"][0]["name"] == f"Test Country {unique}"

            invalid_city = client.post(
                "/api/v1/admin/reference-data/cities",
                json={
                    "countryId": str(uuid4()),
                    "slug": f"missing-country-{unique}",
                    "translations": {
                        "fa": {"name": "شهر آزمایشی"},
                        "en": {"name": "Test City"},
                    },
                },
            )
            assert invalid_city.status_code == 422
            assert invalid_city.json()["error"]["code"] == "REFERENCE_NOT_FOUND"

            country_payload["featured"] = False
            country_payload["translations"]["en"]["name"] = f"Updated Country {unique}"
            updated = client.put(
                f"/api/v1/admin/reference-data/countries/{country_id}",
                json=country_payload,
                headers={"If-Match": initial_etag},
            )
            assert updated.status_code == 200
            assert updated.json()["data"]["translations"]["en"]["name"].startswith("Updated")
            assert updated.headers["etag"] != initial_etag

            stale = client.put(
                f"/api/v1/admin/reference-data/countries/{country_id}",
                json=country_payload,
                headers={"If-Match": initial_etag},
            )
            assert stale.status_code == 412
            assert stale.json()["error"]["code"] == "STALE_WRITE"

            archived = client.delete(
                f"/api/v1/admin/reference-data/countries/{country_id}",
                headers={"If-Match": updated.headers["etag"]},
            )
            assert archived.status_code == 200
            assert archived.json()["data"]["status"] == "archived"

            hidden = client.get(
                "/api/v1/reference-data/countries",
                params={"locale": "en", "q": unique},
            )
            assert hidden.status_code == 200
            assert hidden.json()["total"] == 0

            admin_list = client.get(
                "/api/v1/admin/reference-data/countries",
                params={"locale": "en", "q": unique},
            )
            assert admin_list.status_code == 200
            assert admin_list.json()["data"][0]["status"] == "archived"
    finally:
        app.dependency_overrides.clear()
        if country_id is not None:
            _remove_country(country_id)
        _remove_actor(actor_id)
