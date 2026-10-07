from __future__ import annotations

import os
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.consultations.service import ConsultationService

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1",
    reason="requires migrated PostgreSQL and Redis",
)


def _sync_database_url() -> str:
    return os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")


def _cleanup(reference: str, idempotency_key: str) -> None:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute("SELECT id FROM leads WHERE public_reference = %s", (reference,))
        row = cursor.fetchone()
        if row is None:
            return
        lead_id = row[0]
        cursor.execute(
            "DELETE FROM idempotency_keys WHERE scope = 'consultation.submit' "
            "AND idempotency_key = %s",
            (idempotency_key,),
        )
        cursor.execute("DELETE FROM integration_outbox WHERE aggregate_id = %s", (lead_id,))
        cursor.execute("DELETE FROM integration_sync_records WHERE entity_id = %s", (lead_id,))
        cursor.execute("DELETE FROM consent_records WHERE lead_id = %s", (lead_id,))
        cursor.execute("DELETE FROM leads WHERE id = %s", (lead_id,))


def _database_state(reference: str) -> dict[str, Any]:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "SELECT id, mobile_normalized, duplicate_count FROM leads WHERE public_reference = %s",
            (reference,),
        )
        lead_row = cursor.fetchone()
        assert lead_row is not None
        lead_id, mobile, duplicate_count = lead_row
        cursor.execute("SELECT count(*) FROM consent_records WHERE lead_id = %s", (lead_id,))
        consent_row = cursor.fetchone()
        assert consent_row is not None
        consents = consent_row[0]
        cursor.execute(
            "SELECT event_type, count(*) FROM lead_submission_events WHERE lead_id = %s "
            "GROUP BY event_type ORDER BY event_type",
            (lead_id,),
        )
        events: dict[str, int] = dict(cursor.fetchall())
        cursor.execute(
            "SELECT count(*) FROM integration_outbox WHERE aggregate_id = %s", (lead_id,)
        )
        outbox_row = cursor.fetchone()
        assert outbox_row is not None
        outbox = outbox_row[0]
        cursor.execute(
            "SELECT count(*) FROM integration_sync_records WHERE entity_id = %s", (lead_id,)
        )
        sync_row = cursor.fetchone()
        assert sync_row is not None
        sync_records = sync_row[0]
    return {
        "id": UUID(str(lead_id)),
        "mobile": mobile,
        "duplicateCount": duplicate_count,
        "consents": consents,
        "events": events,
        "outbox": outbox,
        "syncRecords": sync_records,
    }


def test_public_consultation_submission_idempotency_and_deduplication(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    unique = uuid4().int % 1_000_000_000
    national_mobile = f"09{unique:09d}"
    international_mobile = f"+98 9{unique:09d}"
    country = f"Test destination {uuid4().hex[:10]}"
    idempotency_key = f"consultation-{uuid4().hex}"
    payload: dict[str, Any] = {
        "firstName": "مینا",
        "lastName": "احمدی",
        "mobile": national_mobile,
        "email": "mina@example.com",
        "desiredCountryText": country,
        "intakeTerm": "FALL",
        "startYear": datetime.now(UTC).year + 1,
        "age": 27,
        "gender": "SELF_DESCRIBED",
        "genderSelfDescription": "ترجیح شخصی",
        "occupation": "دانشجو",
        "maritalStatus": "SINGLE",
        "message": "درخواست بررسی شرایط",
        "locale": "fa",
        "source": {"pageUrl": "/fa/consultation"},
        "privacyConsent": True,
        "contactConsent": True,
    }
    reference = ""
    collision_reference = ""

    try:
        with TestClient(app) as client:
            created = client.post(
                "/api/v1/consultation-requests",
                json=payload,
                headers={"Idempotency-Key": idempotency_key},
            )
            assert created.status_code == 201, created.text
            assert created.headers["cache-control"] == "no-store"
            reference = created.json()["data"]["reference"]
            assert reference.startswith("JA-")
            assert len(reference) == 11
            assert created.json()["data"]["duplicate"] is False

            replay = client.post(
                "/api/v1/consultation-requests",
                json=payload,
                headers={"Idempotency-Key": idempotency_key},
            )
            assert replay.status_code == 201
            assert replay.json() == created.json()

            duplicate_payload = {**payload, "mobile": international_mobile}
            duplicate = client.post("/api/v1/consultation-requests", json=duplicate_payload)
            assert duplicate.status_code == 200, duplicate.text
            assert duplicate.json()["data"]["reference"] == reference
            assert duplicate.json()["data"]["duplicate"] is True

            invalid_mobile = client.post(
                "/api/v1/consultation-requests", json={**payload, "mobile": "02112345678"}
            )
            assert invalid_mobile.status_code == 422
            assert invalid_mobile.json()["error"]["code"] == "INVALID_MOBILE"

            # Force a collision with an existing code, then allocate a new one in
            # the same transaction. No duplicate lead or consent may be created.
            fresh_reference = ConsultationService._new_reference()
            candidates = iter([reference, fresh_reference])
            monkeypatch.setattr(
                ConsultationService, "_new_reference", staticmethod(lambda: next(candidates))
            )
            collided = client.post(
                "/api/v1/consultation-requests",
                json={**payload, "desiredCountryText": f"{country} collision"},
                headers={"Idempotency-Key": f"{idempotency_key}-collision"},
            )
            assert collided.status_code == 201, collided.text
            collision_reference = collided.json()["data"]["reference"]
            assert collision_reference == fresh_reference
            assert _database_state(collision_reference)["consents"] == 2

        state = _database_state(reference)
        assert state["mobile"] == f"+989{unique:09d}"
        assert state["duplicateCount"] == 1
        assert state["consents"] == 2
        assert state["events"] == {"accepted": 1, "duplicate": 1}
        assert state["outbox"] == 1
        assert state["syncRecords"] == 1
    finally:
        if collision_reference:
            _cleanup(collision_reference, f"{idempotency_key}-collision")
        if reference:
            _cleanup(reference, idempotency_key)
