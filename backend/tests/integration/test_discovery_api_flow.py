from __future__ import annotations

import os
from uuid import UUID, uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1",
    reason="requires migrated PostgreSQL",
)


def _sync_database_url() -> str:
    return os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")


def _seed() -> dict[str, UUID | list[UUID]]:
    marker = uuid4().hex[:8]
    ids: dict[str, UUID | list[UUID]] = {
        "country": uuid4(),
        "city": uuid4(),
        "field": uuid4(),
        "universities": [uuid4(), uuid4(), uuid4()],
        "programs": [uuid4(), uuid4(), uuid4()],
    }
    country = ids["country"]
    city = ids["city"]
    field = ids["field"]
    universities = ids["universities"]
    programs = ids["programs"]
    assert isinstance(country, UUID)
    assert isinstance(city, UUID)
    assert isinstance(field, UUID)
    assert isinstance(universities, list)
    assert isinstance(programs, list)
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO countries (id, iso2, iso3, slug, status) "
            "VALUES (%s, 'AT', 'AUT', %s, 'published')",
            (country, f"austria-{marker}"),
        )
        cursor.executemany(
            "INSERT INTO country_translations (country_id, locale, name) VALUES (%s, %s, %s)",
            [(country, "fa", "اتریش"), (country, "en", "Austria")],
        )
        cursor.execute(
            "INSERT INTO cities (id, country_id, normalized_name, slug) VALUES (%s, %s, %s, %s)",
            (city, country, "vienna", f"vienna-{marker}"),
        )
        cursor.executemany(
            "INSERT INTO city_translations (city_id, locale, name) VALUES (%s, %s, %s)",
            [(city, "fa", "وین"), (city, "en", "Vienna")],
        )
        cursor.execute(
            "INSERT INTO fields_of_study (id, code, slug) VALUES (%s, %s, %s)",
            (field, f"data_science_{marker}", f"data-science-{marker}"),
        )
        cursor.executemany(
            "INSERT INTO field_of_study_translations (field_of_study_id, locale, name) "
            "VALUES (%s, %s, %s)",
            [(field, "fa", "علم داده"), (field, "en", "Data Science")],
        )
        cursor.execute("SELECT id FROM academic_levels WHERE code = 'master'")
        row = cursor.fetchone()
        assert row is not None
        ids["level"] = row[0]
        university_rows = [
            (universities[0], country, city, f"vienna-tech-{marker}", "public", True, "published"),
            (
                universities[1],
                country,
                city,
                f"vienna-applied-{marker}",
                "public",
                False,
                "published",
            ),
            (
                universities[2],
                country,
                city,
                f"hidden-university-{marker}",
                "private",
                False,
                "draft",
            ),
        ]
        cursor.executemany(
            "INSERT INTO universities "
            "(id, country_id, city_id, slug, institution_type, featured, status) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            university_rows,
        )
        translations = []
        names = ["Vienna Technical University", "Vienna Applied University", "Hidden University"]
        fa_names = ["دانشگاه فنی وین", "دانشگاه علمی وین", "دانشگاه مخفی"]
        for university_id, name, fa_name in zip(universities, names, fa_names, strict=True):
            translations.extend(
                [
                    (university_id, "en", name, f"{name} data science and engineering"),
                    (university_id, "fa", fa_name, "آموزش علم داده و مهندسی"),
                ]
            )
        cursor.executemany(
            "INSERT INTO university_translations "
            "(university_id, locale, name, short_description) VALUES (%s, %s, %s, %s)",
            translations,
        )
        program_rows = [
            (
                programs[0],
                universities[0],
                ids["level"],
                field,
                f"advanced-data-science-{marker}",
                "en",
                True,
                "published",
            ),
            (
                programs[1],
                universities[1],
                ids["level"],
                field,
                f"applied-data-analytics-{marker}",
                "en",
                False,
                "published",
            ),
            (
                programs[2],
                universities[2],
                ids["level"],
                field,
                f"hidden-data-program-{marker}",
                "en",
                False,
                "published",
            ),
        ]
        cursor.executemany(
            "INSERT INTO programs (id, university_id, academic_level_id, primary_field_id, "
            "slug, teaching_language_code, featured, status) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            program_rows,
        )
        program_translations = []
        titles = ["Advanced Data Science", "Applied Data Analytics", "Hidden Data Program"]
        fa_titles = ["علم داده پیشرفته", "تحلیل داده کاربردی", "برنامه داده مخفی"]
        for program_id, title, fa_title in zip(programs, titles, fa_titles, strict=True):
            program_translations.extend(
                [
                    (program_id, "en", title, f"{title} program"),
                    (program_id, "fa", fa_title, "برنامه دانشگاهی علم داده"),
                ]
            )
        cursor.executemany(
            "INSERT INTO program_translations "
            "(program_id, locale, title, short_description) VALUES (%s, %s, %s, %s)",
            program_translations,
        )
        cursor.executemany(
            "INSERT INTO program_fields (program_id, field_of_study_id, is_primary) "
            "VALUES (%s, %s, true)",
            [(program_id, field) for program_id in programs],
        )
    return ids


def _cleanup(ids: dict[str, UUID | list[UUID]]) -> None:
    country = ids["country"]
    city = ids["city"]
    field = ids["field"]
    universities = ids["universities"]
    programs = ids["programs"]
    assert isinstance(country, UUID)
    assert isinstance(city, UUID)
    assert isinstance(field, UUID)
    assert isinstance(universities, list)
    assert isinstance(programs, list)
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute("DELETE FROM programs WHERE id = ANY(%s)", (programs,))
        cursor.execute("DELETE FROM fields_of_study WHERE id = %s", (field,))
        cursor.execute("DELETE FROM universities WHERE id = ANY(%s)", (universities,))
        cursor.execute("DELETE FROM cities WHERE id = %s", (city,))
        cursor.execute("DELETE FROM countries WHERE id = %s", (country,))


def test_discovery_search_filter_pagination_suggestions_and_related() -> None:
    ids = _seed()
    universities = ids["universities"]
    programs = ids["programs"]
    assert isinstance(universities, list)
    assert isinstance(programs, list)
    marker = str(programs[0])
    try:
        with TestClient(app) as client:
            university_search = client.get(
                "/api/v1/universities",
                params={"locale": "en", "q": "data science", "limit": 1, "page": 1},
            )
            assert university_search.status_code == 200, university_search.text
            assert university_search.json()["meta"]["total"] == 2
            assert university_search.json()["meta"]["totalPages"] == 2

            program_search = client.get(
                "/api/v1/programs",
                params={
                    "locale": "en",
                    "q": "data",
                    "fieldId": str(ids["field"]),
                    "academicLevelId": str(ids["level"]),
                    "sort": "relevance",
                },
            )
            assert program_search.status_code == 200, program_search.text
            assert program_search.json()["meta"]["total"] == 2
            assert program_search.json()["data"][0]["id"] == str(programs[0])

            suggestions = client.get(
                "/api/v1/discovery/suggestions",
                params={"locale": "en", "q": "Advanced Data", "entityType": "program"},
            )
            assert suggestions.status_code == 200, suggestions.text
            assert suggestions.json()["query"] == "Advanced Data"
            assert [item["id"] for item in suggestions.json()["data"]] == [str(programs[0])]

            university_slug = f"vienna-tech-{str(universities[0]).replace('-', '')[:8]}"
            # Slugs use the seed marker, so resolve the source from its public result.
            source_university = university_search.json()["data"][0]["slug"]
            if source_university != university_slug:
                university_slug = source_university
            related_university = client.get(
                f"/api/v1/universities/{university_slug}/related", params={"locale": "en"}
            )
            assert related_university.status_code == 200, related_university.text
            assert str(universities[1]) in [
                item["id"] for item in related_university.json()["data"]
            ]
            assert "same_country" in related_university.json()["data"][0]["reasons"]

            source_program = next(
                item for item in program_search.json()["data"] if item["id"] == str(programs[0])
            )
            related_program = client.get(
                f"/api/v1/programs/{source_program['slug']}/related", params={"locale": "en"}
            )
            assert related_program.status_code == 200, related_program.text
            assert [item["id"] for item in related_program.json()["data"]] == [str(programs[1])]
            assert "same_level" in related_program.json()["data"][0]["reasons"]
            assert marker not in related_program.text

            missing = client.get("/api/v1/programs/not-a-real-program/related")
            assert missing.status_code == 404
            assert missing.json()["error"]["code"] == "DISCOVERY_SOURCE_NOT_FOUND"
    finally:
        _cleanup(ids)
