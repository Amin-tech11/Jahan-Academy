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


def _seed() -> tuple[UUID, UUID, UUID, UUID, UUID]:
    actor_id, country_id, city_id, logo_id, hero_id = (uuid4() for _ in range(5))
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO users (id, status, preferred_locale) VALUES (%s, 'active', 'fa')",
            (actor_id,),
        )
        cursor.execute(
            "INSERT INTO countries (id, iso2, iso3, slug, status) "
            "VALUES (%s, 'DE', 'DEU', %s, 'published')",
            (country_id, f"germany-{country_id.hex[:8]}"),
        )
        cursor.executemany(
            "INSERT INTO country_translations (country_id, locale, name) VALUES (%s, %s, %s)",
            [(country_id, "fa", "آلمان"), (country_id, "en", "Germany")],
        )
        cursor.execute(
            "INSERT INTO cities (id, country_id, normalized_name, slug) VALUES (%s, %s, %s, %s)",
            (city_id, country_id, "munich", f"munich-{city_id.hex[:8]}"),
        )
        cursor.executemany(
            "INSERT INTO city_translations (city_id, locale, name) VALUES (%s, %s, %s)",
            [(city_id, "fa", "مونیخ"), (city_id, "en", "Munich")],
        )
        for asset_id, purpose, filename in (
            (logo_id, "logo", "logo.png"),
            (hero_id, "university_image", "hero.webp"),
        ):
            cursor.execute(
                "INSERT INTO media_assets (id, storage_provider, bucket, object_key, "
                "original_filename, mime_type, size_bytes, privacy_class, scan_status, purpose, "
                "upload_status, alt_fa, alt_en) VALUES (%s, 's3', 'public', %s, %s, "
                "'image/png', 100, 'public', 'clean', %s, 'ready', 'تصویر دانشگاه', "
                "'University image')",
                (asset_id, f"universities/{asset_id}", filename, purpose),
            )
    return actor_id, country_id, city_id, logo_id, hero_id


def _cleanup(ids: tuple[UUID, UUID, UUID, UUID, UUID], university_ids: list[UUID]) -> None:
    actor_id, country_id, city_id, logo_id, hero_id = ids
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        if university_ids:
            cursor.execute("DELETE FROM audit_logs WHERE entity_id = ANY(%s)", (university_ids,))
            cursor.execute("DELETE FROM universities WHERE id = ANY(%s)", (university_ids,))
        cursor.execute("DELETE FROM media_assets WHERE id = ANY(%s)", ([logo_id, hero_id],))
        cursor.execute("DELETE FROM cities WHERE id = %s", (city_id,))
        cursor.execute("DELETE FROM countries WHERE id = %s", (country_id,))
        cursor.execute("DELETE FROM users WHERE id = %s", (actor_id,))


def test_university_crud_publish_discovery_and_archive() -> None:
    ids = _seed()
    actor_id, country_id, city_id, logo_id, hero_id = ids
    university_ids: list[UUID] = []
    actor = AuthorizationContext(
        user_id=actor_id,
        grants=(
            RoleGrant(
                role="content_editor",
                scope_type="global",
                scope_id=None,
                permissions=frozenset({"catalog.read", "catalog.write"}),
            ),
        ),
    )

    async def actor_override() -> AuthorizationContext:
        return actor

    app.dependency_overrides[authorization_context] = actor_override
    slug = f"technical-university-{uuid4().hex[:10]}"
    payload = {
        "slug": slug,
        "countryId": str(country_id),
        "cityId": str(city_id),
        "institutionType": "public",
        "foundedYear": 1868,
        "websiteUrl": "https://www.tum.de",
        "contactEmail": "admissions@example.edu",
        "contactPhone": "+49 89 289 01",
        "featured": True,
        "tuition": {
            "mode": "range",
            "minimumMinor": 90000,
            "maximumMinor": 120000,
            "currency": "EUR",
        },
        "translations": {
            "fa": {
                "name": "دانشگاه فنی مونیخ",
                "shortDescription": "دانشگاه پژوهشی در مونیخ",
            },
            "en": {
                "name": "Technical University of Munich",
                "shortDescription": "A research university in Munich",
            },
        },
        "rankings": [
            {
                "organization": "QS",
                "year": 2026,
                "rank": 28,
                "sourceUrl": "https://example.com/ranking",
            }
        ],
        "media": [
            {"mediaAssetId": str(logo_id), "role": "logo", "displayOrder": 0},
            {"mediaAssetId": str(hero_id), "role": "hero", "displayOrder": 0},
        ],
    }

    try:
        with TestClient(app) as client:
            created = client.post("/api/v1/admin/universities", json=payload)
            assert created.status_code == 201, created.text
            university_id = UUID(created.json()["data"]["id"])
            university_ids.append(university_id)
            assert created.json()["data"]["translations"]["en"]["name"].startswith("Technical")
            assert created.json()["data"]["tuition"]["currency"] == "EUR"
            assert client.get(f"/api/v1/universities/{slug}").status_code == 404

            stale = client.put(
                f"/api/v1/admin/universities/{university_id}",
                headers={"If-Match": '"99"'},
                json=payload,
            )
            assert stale.status_code == 412

            updated_payload = {**payload, "contactPhone": "+49 89 289 02"}
            updated = client.put(
                f"/api/v1/admin/universities/{university_id}",
                headers={"If-Match": created.headers["etag"]},
                json=updated_payload,
            )
            assert updated.status_code == 200, updated.text
            assert updated.json()["data"]["contactPhone"].endswith("02")

            published = client.post(
                f"/api/v1/admin/universities/{university_id}/publish",
                headers={"If-Match": updated.headers["etag"]},
            )
            assert published.status_code == 200, published.text
            assert published.json()["data"]["status"] == "published"

            public_detail = client.get(f"/api/v1/universities/{slug}", params={"locale": "en"})
            assert public_detail.status_code == 200
            assert public_detail.json()["data"]["country"]["name"] == "Germany"
            assert len(public_detail.json()["data"]["media"]) == 2
            assert "translations" not in public_detail.json()["data"]

            public_list = client.get(
                "/api/v1/universities",
                params={"locale": "en", "countryId": str(country_id), "maximumRank": 50},
            )
            assert public_list.status_code == 200
            assert public_list.json()["meta"]["total"] == 1

            archived = client.post(
                f"/api/v1/admin/universities/{university_id}/archive",
                headers={"If-Match": published.headers["etag"]},
                json={"reason": "Temporarily unavailable for applications"},
            )
            assert archived.status_code == 200, archived.text
            assert archived.json()["data"]["status"] == "archived"
            assert client.get(f"/api/v1/universities/{slug}").status_code == 404

            admin_list = client.get(
                "/api/v1/admin/universities", params={"status": "archived", "q": "مونیخ"}
            )
            assert admin_list.status_code == 200
            assert admin_list.json()["meta"]["total"] == 1

            draft_payload = {
                **payload,
                "slug": f"draft-university-{uuid4().hex[:10]}",
                "media": [],
            }
            draft = client.post("/api/v1/admin/universities", json=draft_payload)
            assert draft.status_code == 201, draft.text
            draft_id = UUID(draft.json()["data"]["id"])
            university_ids.append(draft_id)
            incomplete = client.post(
                f"/api/v1/admin/universities/{draft_id}/publish",
                headers={"If-Match": draft.headers["etag"]},
            )
            assert incomplete.status_code == 422
            assert incomplete.json()["error"]["code"] == "UNIVERSITY_INCOMPLETE"
            deleted = client.delete(
                f"/api/v1/admin/universities/{draft_id}",
                headers={"If-Match": draft.headers["etag"]},
            )
            assert deleted.status_code == 204
            assert client.get(f"/api/v1/admin/universities/{draft_id}").status_code == 404
    finally:
        app.dependency_overrides.clear()
        _cleanup(ids, university_ids)
