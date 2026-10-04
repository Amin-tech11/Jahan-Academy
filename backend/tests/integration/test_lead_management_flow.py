from __future__ import annotations

import os
from datetime import UTC, datetime
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
    reason="requires migrated PostgreSQL and Redis",
)


def _sync_database_url() -> str:
    return os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")


def _create_actor() -> UUID:
    actor_id = uuid4()
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO users (id, status, preferred_locale) VALUES (%s, 'active', 'fa')",
            (actor_id,),
        )
    return actor_id


def _lead_id(reference: str) -> UUID:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute("SELECT id FROM leads WHERE public_reference = %s", (reference,))
        row = cursor.fetchone()
        assert row is not None
        return UUID(str(row[0]))


def _assign(lead_id: UUID, actor_id: UUID) -> None:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "UPDATE leads SET assigned_consultant_id = %s WHERE id = %s",
            (actor_id, lead_id),
        )


def _audit_count(lead_id: UUID) -> int:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "SELECT count(*) FROM audit_logs WHERE entity_type = 'lead' AND entity_id = %s",
            (lead_id,),
        )
        row = cursor.fetchone()
        assert row is not None
        return int(row[0])


def _cleanup(actor_id: UUID, references: list[str]) -> None:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute("SELECT id FROM leads WHERE public_reference = ANY(%s)", (references,))
        lead_ids = [row[0] for row in cursor.fetchall()]
        if lead_ids:
            cursor.execute("DELETE FROM audit_logs WHERE entity_id = ANY(%s)", (lead_ids,))
            cursor.execute(
                "DELETE FROM integration_outbox WHERE aggregate_id = ANY(%s)", (lead_ids,)
            )
            cursor.execute(
                "DELETE FROM integration_sync_records WHERE entity_id = ANY(%s)", (lead_ids,)
            )
            cursor.execute("DELETE FROM consent_records WHERE lead_id = ANY(%s)", (lead_ids,))
            cursor.execute("DELETE FROM leads WHERE id = ANY(%s)", (lead_ids,))
        cursor.execute("DELETE FROM users WHERE id = %s", (actor_id,))


def _public_payload(mobile: str, country: str) -> dict[str, Any]:
    return {
        "firstName": "Mina",
        "lastName": "Ahmadi",
        "mobile": mobile,
        "email": "mina@example.com",
        "age": 29,
        "gender": "female",
        "occupation": "Engineer",
        "maritalStatus": "single",
        "message": "تحصیلات: لیسانس\nسرمایه مهاجرت: ۱ الی ۲ میلیارد\nمهارت زبان انگلیسی: متوسط",
        "desiredCountryText": country,
        "intakeTerm": "fall",
        "startYear": datetime.now(UTC).year + 1,
        "locale": "fa",
        "source": {"pageUrl": "/fa/consultation"},
        "privacyConsent": True,
        "contactConsent": True,
    }


def test_lead_list_detail_edit_archive_and_assigned_scope() -> None:
    actor_id = _create_actor()
    context_box = {
        "value": AuthorizationContext(
            user_id=actor_id,
            grants=(
                RoleGrant(
                    role="support",
                    scope_type="global",
                    scope_id=None,
                    permissions=frozenset({"lead.read.all", "lead.write.all"}),
                ),
            ),
        )
    }

    async def context_override() -> AuthorizationContext:
        return context_box["value"]

    app.dependency_overrides[authorization_context] = context_override
    suffix_a = uuid4().int % 1_000_000_000
    suffix_b = uuid4().int % 1_000_000_000
    references: list[str] = []

    try:
        with TestClient(app) as client:
            first = client.post(
                "/api/v1/consultation-requests",
                json=_public_payload(f"09{suffix_a:09d}", f"Germany {uuid4().hex[:6]}"),
            )
            second = client.post(
                "/api/v1/consultation-requests",
                json=_public_payload(f"09{suffix_b:09d}", f"Canada {uuid4().hex[:6]}"),
            )
            assert first.status_code == 201, first.text
            assert second.status_code == 201, second.text
            reference = first.json()["data"]["reference"]
            other_reference = second.json()["data"]["reference"]
            references.extend([reference, other_reference])
            lead_id = _lead_id(reference)
            other_lead_id = _lead_id(other_reference)

            listing = client.get("/api/v1/admin/leads", params={"q": reference})
            assert listing.status_code == 200, listing.text
            assert listing.json()["meta"]["total"] == 1
            assert listing.json()["data"][0]["reference"] == reference
            summary = listing.json()["data"][0]
            assert summary["age"] == 29
            assert summary["gender"] == "female"
            assert summary["occupation"] == "Engineer"
            assert summary["maritalStatus"] == "single"
            assert "تحصیلات: لیسانس" in summary["message"]

            detail = client.get(f"/api/v1/admin/leads/{lead_id}")
            assert detail.status_code == 200
            assert detail.headers["etag"] == '"1"'
            assert detail.headers["cache-control"] == "no-store"

            updated = client.patch(
                f"/api/v1/admin/leads/{lead_id}",
                headers={"If-Match": detail.headers["etag"]},
                json={"occupation": "Software Engineer", "email": "new@example.com"},
            )
            assert updated.status_code == 200, updated.text
            assert updated.json()["data"]["occupation"] == "Software Engineer"
            assert updated.json()["data"]["email"] == "new@example.com"
            assert updated.headers["etag"] == '"2"'
            refreshed = client.get("/api/v1/admin/leads", params={"q": reference})
            assert refreshed.json()["data"][0]["occupation"] == "Software Engineer"

            stale = client.patch(
                f"/api/v1/admin/leads/{lead_id}",
                headers={"If-Match": '"1"'},
                json={"occupation": "Stale update"},
            )
            assert stale.status_code == 412
            assert stale.json()["error"]["code"] == "STALE_WRITE"

            _assign(lead_id, actor_id)
            context_box["value"] = AuthorizationContext(
                user_id=actor_id,
                grants=(
                    RoleGrant(
                        role="consultant",
                        scope_type="global",
                        scope_id=None,
                        permissions=frozenset({"lead.read.assigned"}),
                    ),
                ),
            )
            assigned = client.get("/api/v1/admin/leads")
            assert assigned.status_code == 200
            assert assigned.json()["meta"]["total"] == 1
            assert assigned.json()["data"][0]["id"] == str(lead_id)
            hidden = client.get(f"/api/v1/admin/leads/{other_lead_id}")
            assert hidden.status_code == 404

            context_box["value"] = AuthorizationContext(
                user_id=actor_id,
                grants=(
                    RoleGrant(
                        role="support",
                        scope_type="global",
                        scope_id=None,
                        permissions=frozenset({"lead.read.all", "lead.write.all"}),
                    ),
                ),
            )
            archived = client.post(
                f"/api/v1/admin/leads/{lead_id}/archive",
                headers={"If-Match": updated.headers["etag"]},
                json={"reason": "Consultation request completed outside the platform"},
            )
            assert archived.status_code == 200, archived.text
            assert archived.json()["data"]["archived"] is True
            assert archived.json()["data"]["archiveReason"].startswith("Consultation")

            active_search = client.get("/api/v1/admin/leads", params={"q": reference})
            assert active_search.json()["meta"]["total"] == 0
            archived_search = client.get(
                "/api/v1/admin/leads", params={"q": reference, "archive": "all"}
            )
            assert archived_search.json()["meta"]["total"] == 1

        assert _audit_count(lead_id) == 2
    finally:
        app.dependency_overrides.clear()
        _cleanup(actor_id, references)
