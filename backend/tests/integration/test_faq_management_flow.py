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


def _seed_context() -> dict[str, UUID]:
    ids = {
        "actor": uuid4(),
        "country": uuid4(),
        "university": uuid4(),
        "level": uuid4(),
        "program": uuid4(),
        "service": uuid4(),
    }
    marker = uuid4().hex[:10]
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO users (id, status, preferred_locale) VALUES (%s, 'active', 'fa')",
            (ids["actor"],),
        )
        cursor.execute(
            "INSERT INTO countries (id, iso2, slug, status) VALUES (%s, %s, %s, 'published')",
            (ids["country"], marker[:2].upper(), f"faq-country-{marker}"),
        )
        cursor.execute(
            "INSERT INTO universities (id, country_id, slug, status, published_at) "
            "VALUES (%s, %s, %s, 'published', now())",
            (ids["university"], ids["country"], f"faq-university-{marker}"),
        )
        cursor.execute(
            "INSERT INTO academic_levels (id, code) VALUES (%s, %s)",
            (ids["level"], f"FAQ-{marker}"),
        )
        cursor.execute(
            "INSERT INTO programs (id, university_id, academic_level_id, slug, status, "
            "published_at) VALUES (%s, %s, %s, %s, 'published', now())",
            (ids["program"], ids["university"], ids["level"], f"faq-program-{marker}"),
        )
        cursor.execute(
            "INSERT INTO services (id, slug, status) VALUES (%s, %s, 'published')",
            (ids["service"], f"faq-service-{marker}"),
        )
    return ids


def _cleanup(ids: dict[str, UUID], faq_ids: list[UUID]) -> None:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        if faq_ids:
            cursor.execute("DELETE FROM audit_logs WHERE entity_id = ANY(%s)", (faq_ids,))
            cursor.execute("DELETE FROM faqs WHERE id = ANY(%s)", (faq_ids,))
        cursor.execute("DELETE FROM services WHERE id = %s", (ids["service"],))
        cursor.execute("DELETE FROM programs WHERE id = %s", (ids["program"],))
        cursor.execute("DELETE FROM academic_levels WHERE id = %s", (ids["level"],))
        cursor.execute("DELETE FROM universities WHERE id = %s", (ids["university"],))
        cursor.execute("DELETE FROM countries WHERE id = %s", (ids["country"],))
        cursor.execute("DELETE FROM users WHERE id = %s", (ids["actor"],))


def _payload(ids: dict[str, UUID], marker: str, order: int) -> dict[str, object]:
    return {
        "translations": {
            "fa": {
                "question": f"پرسش اپلای {marker} چیست؟",
                "answer": f"پاسخ فارسی {marker}",
            },
            "en": {
                "question": f"What is the {marker} application process?",
                "answer": f"English {marker} answer",
            },
        },
        "assignments": [
            {"targetType": "general", "displayOrder": order},
            {
                "targetType": "university",
                "targetId": str(ids["university"]),
                "displayOrder": order,
            },
            {
                "targetType": "program",
                "targetId": str(ids["program"]),
                "displayOrder": order,
            },
            {
                "targetType": "service",
                "targetId": str(ids["service"]),
                "displayOrder": order,
            },
        ],
    }


def test_faq_translation_scopes_ordering_lifecycle_and_public_visibility() -> None:
    ids = _seed_context()
    faq_ids: list[UUID] = []
    actor = AuthorizationContext(
        user_id=ids["actor"],
        grants=(
            RoleGrant(
                role="content_editor",
                scope_type="global",
                scope_id=None,
                permissions=frozenset({"content.read", "content.write", "content.publish"}),
            ),
        ),
    )

    async def actor_override() -> AuthorizationContext:
        return actor

    app.dependency_overrides[authorization_context] = actor_override
    try:
        with TestClient(app) as client:
            created: list[dict[str, object]] = []
            for marker, order in (("first", 20), ("second", 10)):
                response = client.post("/api/v1/admin/faqs", json=_payload(ids, marker, order))
                assert response.status_code == 201, response.text
                faq_id = UUID(response.json()["data"]["id"])
                faq_ids.append(faq_id)
                assert response.json()["data"]["status"] == "draft"
                assert client.get(f"/api/v1/faqs/{faq_id}").status_code == 404

                published = client.post(
                    f"/api/v1/admin/faqs/{faq_id}/publish",
                    headers={"If-Match": response.headers["etag"]},
                )
                assert published.status_code == 200, published.text
                created.append(published.json()["data"])

            general = client.get("/api/v1/faqs", params={"locale": "en"})
            assert general.status_code == 200, general.text
            assert [item["id"] for item in general.json()["data"][:2]] == [
                str(faq_ids[1]),
                str(faq_ids[0]),
            ]
            assert "translations" not in general.json()["data"][0]

            for target_type in ("university", "program", "service"):
                scoped = client.get(
                    "/api/v1/faqs",
                    params={
                        "locale": "fa",
                        "targetType": target_type,
                        "targetId": str(ids[target_type]),
                    },
                )
                assert scoped.status_code == 200, scoped.text
                assert scoped.json()["meta"]["total"] == 2

            invalid_target = client.post(
                "/api/v1/admin/faqs",
                json={
                    "translations": _payload(ids, "invalid", 1)["translations"],
                    "assignments": [
                        {
                            "targetType": "program",
                            "targetId": str(uuid4()),
                            "displayOrder": 1,
                        }
                    ],
                },
            )
            assert invalid_target.status_code == 422

            reordered = client.put(
                "/api/v1/admin/faqs/order",
                json={
                    "targetType": "general",
                    "items": [
                        {"faqId": str(faq_ids[0]), "displayOrder": 1},
                        {"faqId": str(faq_ids[1]), "displayOrder": 2},
                    ],
                },
            )
            assert reordered.status_code == 204, reordered.text
            reordered_public = client.get("/api/v1/faqs", params={"locale": "en"})
            assert [item["id"] for item in reordered_public.json()["data"][:2]] == [
                str(faq_ids[0]),
                str(faq_ids[1]),
            ]

            current = client.get(f"/api/v1/admin/faqs/{faq_ids[0]}")
            stale = client.put(
                f"/api/v1/admin/faqs/{faq_ids[0]}",
                headers={"If-Match": '"1"'},
                json=_payload(ids, "changed", 5),
            )
            assert stale.status_code == 412

            archived = client.post(
                f"/api/v1/admin/faqs/{faq_ids[0]}/archive",
                headers={"If-Match": current.headers["etag"]},
                json={"reason": "Answer requires editorial review"},
            )
            assert archived.status_code == 200, archived.text
            assert archived.json()["data"]["status"] == "archived"
            assert client.get(f"/api/v1/faqs/{faq_ids[0]}").status_code == 404
    finally:
        app.dependency_overrides.pop(authorization_context, None)
        _cleanup(ids, faq_ids)
