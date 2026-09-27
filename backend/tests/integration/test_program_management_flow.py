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


def _seed() -> dict[str, UUID]:
    ids = {name: uuid4() for name in ("actor", "country", "city", "university", "field")}
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO users (id, status, preferred_locale) VALUES (%s, 'active', 'fa')",
            (ids["actor"],),
        )
        cursor.execute(
            "INSERT INTO countries (id, iso2, iso3, slug, status) "
            "VALUES (%s, 'DE', 'DEU', %s, 'published')",
            (ids["country"], f"germany-{ids['country'].hex[:8]}"),
        )
        cursor.executemany(
            "INSERT INTO country_translations (country_id, locale, name) VALUES (%s, %s, %s)",
            [(ids["country"], "fa", "آلمان"), (ids["country"], "en", "Germany")],
        )
        cursor.execute(
            "INSERT INTO cities (id, country_id, normalized_name, slug) VALUES (%s, %s, %s, %s)",
            (ids["city"], ids["country"], "munich", f"munich-{ids['city'].hex[:8]}"),
        )
        cursor.executemany(
            "INSERT INTO city_translations (city_id, locale, name) VALUES (%s, %s, %s)",
            [(ids["city"], "fa", "مونیخ"), (ids["city"], "en", "Munich")],
        )
        cursor.execute(
            "INSERT INTO universities (id, country_id, city_id, slug, status) "
            "VALUES (%s, %s, %s, %s, 'published')",
            (
                ids["university"],
                ids["country"],
                ids["city"],
                f"tum-{ids['university'].hex[:8]}",
            ),
        )
        cursor.executemany(
            "INSERT INTO university_translations (university_id, locale, name) VALUES (%s, %s, %s)",
            [
                (ids["university"], "fa", "دانشگاه فنی مونیخ"),
                (ids["university"], "en", "Technical University of Munich"),
            ],
        )
        cursor.execute(
            "INSERT INTO fields_of_study (id, code, slug) VALUES (%s, %s, %s)",
            (
                ids["field"],
                f"computer_science_{ids['field'].hex[:6]}",
                f"cs-{ids['field'].hex[:8]}",
            ),
        )
        cursor.executemany(
            "INSERT INTO field_of_study_translations (field_of_study_id, locale, name) "
            "VALUES (%s, %s, %s)",
            [
                (ids["field"], "fa", "علوم کامپیوتر"),
                (ids["field"], "en", "Computer Science"),
            ],
        )
        cursor.execute("SELECT id FROM academic_levels WHERE code = 'master'")
        level_row = cursor.fetchone()
        assert level_row is not None
        ids["level"] = level_row[0]
        cursor.execute("SELECT id FROM intakes WHERE code = 'fall'")
        intake_row = cursor.fetchone()
        assert intake_row is not None
        ids["intake"] = intake_row[0]
    return ids


def _cleanup(ids: dict[str, UUID], program_ids: list[UUID]) -> None:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        if program_ids:
            cursor.execute("DELETE FROM audit_logs WHERE entity_id = ANY(%s)", (program_ids,))
            cursor.execute("DELETE FROM programs WHERE id = ANY(%s)", (program_ids,))
        cursor.execute("DELETE FROM fields_of_study WHERE id = %s", (ids["field"],))
        cursor.execute("DELETE FROM universities WHERE id = %s", (ids["university"],))
        cursor.execute("DELETE FROM cities WHERE id = %s", (ids["city"],))
        cursor.execute("DELETE FROM countries WHERE id = %s", (ids["country"],))
        cursor.execute("DELETE FROM users WHERE id = %s", (ids["actor"],))


def test_program_crud_publish_discovery_and_archive() -> None:
    ids = _seed()
    program_ids: list[UUID] = []
    actor = AuthorizationContext(
        user_id=ids["actor"],
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
    slug = f"master-computer-science-{uuid4().hex[:8]}"
    payload = {
        "universityId": str(ids["university"]),
        "academicLevelId": str(ids["level"]),
        "primaryFieldId": str(ids["field"]),
        "fieldIds": [str(ids["field"])],
        "slug": slug,
        "durationValue": 2,
        "durationUnit": "year",
        "tuition": {
            "mode": "range",
            "minimumMinor": 90000,
            "maximumMinor": 120000,
            "currency": "EUR",
        },
        "applicationFee": {"mode": "exact", "amountMinor": 7500, "currency": "EUR"},
        "teachingLanguageCode": "en",
        "officialUrl": "https://www.tum.de/studies/computer-science",
        "featured": True,
        "translations": {
            "fa": {
                "title": "کارشناسی ارشد علوم کامپیوتر",
                "shortDescription": "برنامه دو ساله علوم کامپیوتر",
                "admissionRequirements": "مدرک کارشناسی مرتبط و مدرک زبان",
            },
            "en": {
                "title": "Master of Computer Science",
                "shortDescription": "A two-year computer science program",
                "admissionRequirements": "Related bachelor degree and language certificate",
            },
        },
        "intakes": [
            {
                "intakeId": str(ids["intake"]),
                "year": 2027,
                "applicationDeadline": "2027-05-31",
                "status": "open",
                "notesFa": "ورودی پاییز",
                "notesEn": "Fall intake",
            }
        ],
        "requirements": [
            {
                "requirementType": "language_test",
                "code": "IELTS",
                "required": True,
                "value": {"minimumOverall": 6.5},
                "descriptionFa": "حداقل آیلتس ۶.۵",
                "descriptionEn": "Minimum IELTS 6.5",
            }
        ],
    }

    try:
        with TestClient(app) as client:
            created = client.post("/api/v1/admin/programs", json=payload)
            assert created.status_code == 201, created.text
            program_id = UUID(created.json()["data"]["id"])
            program_ids.append(program_id)
            assert created.json()["data"]["applicationFee"]["amountMinor"] == 7500
            assert created.json()["data"]["intakes"][0]["applicationDeadline"] == "2027-05-31"
            assert client.get(f"/api/v1/programs/{slug}").status_code == 404

            stale = client.put(
                f"/api/v1/admin/programs/{program_id}",
                headers={"If-Match": '"99"'},
                json=payload,
            )
            assert stale.status_code == 412

            updated_payload = {**payload, "durationValue": 1.5}
            updated = client.put(
                f"/api/v1/admin/programs/{program_id}",
                headers={"If-Match": created.headers["etag"]},
                json=updated_payload,
            )
            assert updated.status_code == 200, updated.text
            assert updated.json()["data"]["durationValue"] == 1.5

            published = client.post(
                f"/api/v1/admin/programs/{program_id}/publish",
                headers={"If-Match": updated.headers["etag"]},
            )
            assert published.status_code == 200, published.text
            assert published.json()["data"]["status"] == "published"

            public_detail = client.get(f"/api/v1/programs/{slug}", params={"locale": "en"})
            assert public_detail.status_code == 404
            assert client.get("/api/v1/programs", params={"locale": "en"}).status_code == 404

            archived = client.post(
                f"/api/v1/admin/programs/{program_id}/archive",
                headers={"If-Match": published.headers["etag"]},
                json={"reason": "Admissions are temporarily closed"},
            )
            assert archived.status_code == 200, archived.text
            assert archived.json()["data"]["status"] == "archived"
            assert client.get(f"/api/v1/programs/{slug}").status_code == 404

            incomplete_payload = {
                **payload,
                "slug": f"draft-program-{uuid4().hex[:8]}",
                "officialUrl": None,
                "intakes": [],
            }
            draft = client.post("/api/v1/admin/programs", json=incomplete_payload)
            assert draft.status_code == 201, draft.text
            draft_id = UUID(draft.json()["data"]["id"])
            program_ids.append(draft_id)
            incomplete = client.post(
                f"/api/v1/admin/programs/{draft_id}/publish",
                headers={"If-Match": draft.headers["etag"]},
            )
            assert incomplete.status_code == 422
            assert incomplete.json()["error"]["code"] == "PROGRAM_INCOMPLETE"
            deleted = client.delete(
                f"/api/v1/admin/programs/{draft_id}",
                headers={"If-Match": draft.headers["etag"]},
            )
            assert deleted.status_code == 204
    finally:
        app.dependency_overrides.clear()
        _cleanup(ids, program_ids)
