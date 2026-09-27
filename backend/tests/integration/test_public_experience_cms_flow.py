from __future__ import annotations

import os
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
    return os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")


def _seed_actor() -> UUID:
    actor_id = uuid4()
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO users (id, status, preferred_locale) VALUES (%s, 'active', 'fa')",
            (actor_id,),
        )
    return actor_id


def _cleanup(actor_id: UUID, country_id: UUID | None, entity_ids: list[UUID]) -> None:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        if entity_ids:
            cursor.execute("DELETE FROM audit_logs WHERE entity_id = ANY(%s)", (entity_ids,))
            cursor.execute("DELETE FROM country_guides WHERE id = ANY(%s)", (entity_ids,))
            cursor.execute("DELETE FROM public_pages WHERE id = ANY(%s)", (entity_ids,))
        if country_id is not None:
            cursor.execute("DELETE FROM countries WHERE id = %s", (country_id,))
        cursor.execute("DELETE FROM users WHERE id = %s", (actor_id,))


def _translations(marker: str) -> dict[str, dict[str, object]]:
    return {
        "fa": {
            "title": f"راهنمای {marker}",
            "summary": "محتوای فارسی آزمایشی",
            "seoTitle": "عنوان سئو فارسی",
            "seoDescription": "توضیح سئو فارسی",
        },
        "en": {
            "title": f"Guide {marker}",
            "summary": "English test content",
            "seoTitle": "English SEO title",
            "seoDescription": "English SEO description",
        },
    }


def test_public_experience_publish_lifecycle_and_translation_visibility() -> None:
    actor_id = _seed_actor()
    entity_ids: list[UUID] = []
    country_id: UUID | None = None
    actor = AuthorizationContext(
        user_id=actor_id,
        grants=(
            RoleGrant(
                role="content_editor",
                scope_type="global",
                scope_id=None,
                permissions=frozenset(
                    {
                        "content.read",
                        "content.write",
                        "content.publish",
                        "reference_data.write",
                    }
                ),
            ),
        ),
    )

    async def actor_override() -> AuthorizationContext:
        return actor

    app.dependency_overrides[authorization_context] = actor_override
    marker = uuid4().hex[:8]
    country_slug = f"cms-country-{marker}"
    translations = _translations(marker)
    try:
        with TestClient(app) as client:
            country = client.post(
                "/api/v1/admin/reference-data/countries",
                json={
                    "iso2": "QZ",
                    "iso3": "QZZ",
                    "slug": country_slug,
                    "status": "published",
                    "translations": {
                        "fa": {"name": f"کشور {marker}"},
                        "en": {"name": f"Country {marker}"},
                    },
                },
            )
            assert country.status_code == 201, country.text
            country_id = UUID(country.json()["data"]["id"])

            home = client.post(
                "/api/v1/admin/public-pages",
                json={
                    "slug": "home",
                    "pageKind": "home",
                    "translations": {
                        "fa": {
                            **translations["fa"],
                            "blocks": [{"type": "hero", "title": "شروع مهاجرت تحصیلی"}],
                        },
                        "en": {
                            **translations["en"],
                            "blocks": [{"type": "hero", "title": "Start your study journey"}],
                        },
                    },
                },
            )
            assert home.status_code == 201, home.text
            home_id = UUID(home.json()["data"]["id"])
            entity_ids.append(home_id)
            assert client.get("/api/v1/public/home").status_code == 404

            published_home = client.post(
                f"/api/v1/admin/public-pages/{home_id}/publish",
                headers={"If-Match": home.headers["etag"]},
            )
            assert published_home.status_code == 200, published_home.text
            public_home = client.get("/api/v1/public/home", params={"locale": "en"})
            assert public_home.status_code == 200, public_home.text
            assert public_home.json()["data"]["title"] == f"Guide {marker}"
            assert "translations" not in public_home.json()["data"]

            guide = client.post(
                "/api/v1/admin/country-guides",
                json={
                    "countryId": str(country_id),
                    "translations": {
                        "fa": {
                            **translations["fa"],
                            "facts": [{"label": "زبان", "value": "انگلیسی"}],
                            "sections": [{"title": "تحصیل", "body": "راهنمای تحصیل"}],
                            "sources": [{"label": "منبع", "url": "https://example.com/fa"}],
                        },
                        "en": {
                            **translations["en"],
                            "facts": [{"label": "Language", "value": "English"}],
                            "sections": [{"title": "Study", "body": "Study guide"}],
                            "sources": [{"label": "Source", "url": "https://example.com/en"}],
                        },
                    },
                },
            )
            assert guide.status_code == 201, guide.text
            guide_id = UUID(guide.json()["data"]["id"])
            entity_ids.append(guide_id)
            assert client.get(f"/api/v1/public/country-guides/{country_slug}").status_code == 404

            published_guide = client.post(
                f"/api/v1/admin/country-guides/{guide_id}/publish",
                headers={"If-Match": guide.headers["etag"]},
            )
            assert published_guide.status_code == 200, published_guide.text
            public_guide = client.get(
                f"/api/v1/public/country-guides/{country_slug}", params={"locale": "en"}
            )
            assert public_guide.status_code == 200, public_guide.text
            assert public_guide.json()["data"]["countryName"] == f"Country {marker}"
            assert "translations" not in public_guide.json()["data"]
    finally:
        app.dependency_overrides.pop(authorization_context, None)
        _cleanup(actor_id, country_id, entity_ids)
