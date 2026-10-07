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


def _create_staff(*, consultant: bool = False) -> UUID:
    user_id = uuid4()
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO users (id, status, preferred_locale) VALUES (%s, 'active', 'fa')",
            (user_id,),
        )
        cursor.execute(
            "INSERT INTO user_profiles (user_id, first_name, last_name) "
            "VALUES (%s, 'Test', 'Staff')",
            (user_id,),
        )
        if consultant:
            cursor.execute(
                "INSERT INTO user_roles (user_id, role_id, scope_type) "
                "SELECT %s, id, 'global' FROM roles WHERE code = 'consultant'",
                (user_id,),
            )
    return user_id


def _lead_id(reference: str) -> UUID:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute("SELECT id FROM leads WHERE public_reference = %s", (reference,))
        row = cursor.fetchone()
        assert row is not None
        return UUID(str(row[0]))


def _cleanup(user_ids: list[UUID], reference: str | None) -> None:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        if reference:
            cursor.execute("SELECT id FROM leads WHERE public_reference = %s", (reference,))
            row = cursor.fetchone()
            if row:
                lead_id = row[0]
                cursor.execute("DELETE FROM audit_logs WHERE entity_id = %s", (lead_id,))
                cursor.execute("DELETE FROM integration_outbox WHERE aggregate_id = %s", (lead_id,))
                cursor.execute(
                    "DELETE FROM integration_sync_records WHERE entity_id = %s", (lead_id,)
                )
                cursor.execute("DELETE FROM consent_records WHERE lead_id = %s", (lead_id,))
                cursor.execute("DELETE FROM leads WHERE id = %s", (lead_id,))
        cursor.execute("DELETE FROM users WHERE id = ANY(%s)", (user_ids,))


def _payload(mobile: str) -> dict[str, Any]:
    return {
        "firstName": "Workflow",
        "lastName": "Applicant",
        "mobile": mobile,
        "desiredCountryText": "Germany",
        "intakeTerm": "fall",
        "startYear": datetime.now(UTC).year + 1,
        "locale": "fa",
        "source": {"pageUrl": "/fa/consultation"},
        "privacyConsent": True,
        "contactConsent": True,
    }


def _context(user_id: UUID, role: str, permissions: set[str]) -> AuthorizationContext:
    return AuthorizationContext(
        user_id=user_id,
        grants=(
            RoleGrant(
                role=role,
                scope_type="global",
                scope_id=None,
                permissions=frozenset(permissions),
            ),
        ),
    )


def test_assignment_transfer_status_workflow_and_history() -> None:
    support_id = _create_staff()
    consultant_a = _create_staff(consultant=True)
    consultant_b = _create_staff(consultant=True)
    user_ids = [support_id, consultant_a, consultant_b]
    context_box = {
        "value": _context(
            support_id,
            "support",
            {"lead.read.all", "lead.write.all", "lead.assign"},
        )
    }

    async def context_override() -> AuthorizationContext:
        return context_box["value"]

    app.dependency_overrides[authorization_context] = context_override
    reference: str | None = None
    suffix = uuid4().int % 1_000_000_000

    try:
        with TestClient(app) as client:
            submitted = client.post(
                "/api/v1/consultation-requests", json=_payload(f"09{suffix:09d}")
            )
            assert submitted.status_code == 201, submitted.text
            reference = submitted.json()["data"]["reference"]
            lead_id = _lead_id(reference)

            assigned = client.post(
                f"/api/v1/admin/leads/{lead_id}/assignments",
                headers={"If-Match": '"1"'},
                json={"consultantId": str(consultant_a), "reason": "Initial allocation"},
            )
            assert assigned.status_code == 200, assigned.text
            assert assigned.json()["data"]["status"] == "assigned"
            assert assigned.json()["data"]["assignee"]["id"] == str(consultant_a)
            assert assigned.headers["etag"] == '"2"'

            context_box["value"] = _context(
                consultant_a,
                "consultant",
                {"lead.read.assigned", "lead.write.assigned"},
            )
            contacted = client.post(
                f"/api/v1/admin/leads/{lead_id}/status-transitions",
                headers={"If-Match": '"2"'},
                json={"toStatus": "contacted", "reason": "Initial call completed"},
            )
            assert contacted.status_code == 200, contacted.text
            assert contacted.json()["data"]["status"] == "contacted"

            invalid = client.post(
                f"/api/v1/admin/leads/{lead_id}/status-transitions",
                headers={"If-Match": '"3"'},
                json={"toStatus": "converted"},
            )
            assert invalid.status_code == 400
            assert invalid.json()["error"]["code"] == "INVALID_STATE_TRANSITION"

            context_box["value"] = _context(
                support_id,
                "support",
                {"lead.read.all", "lead.write.all", "lead.assign"},
            )
            transferred = client.post(
                f"/api/v1/admin/leads/{lead_id}/assignments",
                headers={"If-Match": '"3"'},
                json={"consultantId": str(consultant_b), "reason": "Specialist transfer"},
            )
            assert transferred.status_code == 200, transferred.text
            assert transferred.json()["data"]["status"] == "contacted"
            assert transferred.json()["data"]["assignee"]["id"] == str(consultant_b)

            stale = client.post(
                f"/api/v1/admin/leads/{lead_id}/assignments",
                headers={"If-Match": '"3"'},
                json={"consultantId": str(consultant_a)},
            )
            assert stale.status_code == 412

            context_box["value"] = _context(
                consultant_a,
                "consultant",
                {"lead.read.assigned", "lead.write.assigned"},
            )
            denied = client.post(
                f"/api/v1/admin/leads/{lead_id}/status-transitions",
                headers={"If-Match": '"4"'},
                json={"toStatus": "qualified"},
            )
            assert denied.status_code == 403

            context_box["value"] = _context(
                consultant_b,
                "consultant",
                {"lead.read.assigned", "lead.write.assigned"},
            )
            version = 4
            for next_status in ("qualified", "converted", "closed"):
                response = client.post(
                    f"/api/v1/admin/leads/{lead_id}/status-transitions",
                    headers={"If-Match": f'"{version}"'},
                    json={"toStatus": next_status, "reason": f"Moved to {next_status}"},
                )
                assert response.status_code == 200, response.text
                version += 1
                assert response.json()["data"]["status"] == next_status
                assert response.headers["etag"] == f'"{version}"'

            history = client.get(f"/api/v1/admin/leads/{lead_id}/history")
            assert history.status_code == 200, history.text
            assert len(history.json()["data"]["assignments"]) == 2
            assert history.json()["data"]["assignments"][1]["unassignedAt"] is not None
            statuses = [item["newStatus"] for item in history.json()["data"]["statuses"]]
            assert statuses == ["closed", "converted", "qualified", "contacted", "assigned", "new"]

            context_box["value"] = _context(
                support_id,
                "support",
                {"lead.read.all", "lead.write.all", "lead.assign"},
            )
            closed_assignment = client.post(
                f"/api/v1/admin/leads/{lead_id}/assignments",
                headers={"If-Match": f'"{version}"'},
                json={"consultantId": str(consultant_a)},
            )
            assert closed_assignment.status_code == 400
            assert closed_assignment.json()["error"]["code"] == "INVALID_STATE_TRANSITION"

            reopened = client.post(
                f"/api/v1/admin/leads/{lead_id}/status-transitions",
                headers={"If-Match": f'"{version}"'},
                json={"toStatus": "contacted", "reason": "Reopened for follow-up"},
            )
            assert reopened.status_code == 200, reopened.text
            assert reopened.json()["data"]["status"] == "contacted"
            assert reopened.headers["etag"] == f'"{version + 1}"'

            reopened_history = client.get(f"/api/v1/admin/leads/{lead_id}/history")
            assert reopened_history.status_code == 200, reopened_history.text
            latest_transition = reopened_history.json()["data"]["statuses"][0]
            assert latest_transition["oldStatus"] == "closed"
            assert latest_transition["newStatus"] == "contacted"
    finally:
        app.dependency_overrides.clear()
        _cleanup(user_ids, reference)
