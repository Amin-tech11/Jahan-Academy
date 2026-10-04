from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError

from app.core.config import Settings
from app.modules.consultations.rate_limit import ConsultationRateLimiter
from app.modules.consultations.repository import (
    ConsultationRepository,
    IdempotencyRecord,
    LeadRecord,
)
from app.modules.consultations.schemas import ConsultationCreate
from app.modules.consultations.service import ConsultationService
from app.shared.exceptions import ApplicationError


def _setup() -> tuple[ConsultationService, Mock, ConsultationCreate]:
    repository = Mock(spec=ConsultationRepository)
    repository.session = Mock(commit=AsyncMock(), rollback=AsyncMock())
    repository.find_duplicate.return_value = None
    repository.get_idempotency.return_value = None
    limiter = Mock(spec=ConsultationRateLimiter)
    limiter.allow.return_value = True
    service = ConsultationService(repository, limiter, Settings())
    payload = ConsultationCreate.model_validate(
        {
            "firstName": "Test",
            "lastName": "Reference",
            "mobile": "+12025550149",
            "desiredCountryText": "Undecided",
            "intakeTerm": "unknown",
            "startYear": datetime.now(UTC).year,
            "locale": "fa",
            "source": {"pageUrl": "/fa"},
            "privacyConsent": True,
            "contactConsent": True,
        }
    )
    return service, repository, payload


def test_short_reference_uses_eight_secure_unambiguous_characters(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    choice = Mock(return_value="A")
    monkeypatch.setattr("app.modules.consultations.service.secrets.choice", choice)
    assert ConsultationService._new_reference() == "JA-AAAAAAAA"
    assert choice.call_count == 8
    alphabet = choice.call_args.args[0]
    assert len(set(alphabet)) == 32
    assert not set("01IO").intersection(alphabet)


async def test_reference_collision_retries_before_writing_related_records() -> None:
    service, repository, payload = _setup()
    lead = LeadRecord(uuid4(), "JA-ABCDEFGH", datetime.now(UTC))
    repository.create_lead.side_effect = [None, lead]
    result = await service.submit(
        payload, idempotency_key="reference-retry-key", client_ip="127.0.0.1", user_agent="test"
    )
    assert result.status_code == 201
    assert result.receipt.reference == lead.public_reference
    assert repository.create_lead.await_count == 2
    assert repository.record_consent.await_count == 2
    repository.initialize_lead_workflow.assert_awaited_once_with(lead.id)
    repository.session.commit.assert_awaited_once()
    assert repository.save_idempotency.call_args.kwargs["response_body"]["reference"] == (
        lead.public_reference
    )


async def test_exhausted_reference_retries_do_not_create_partial_receipts() -> None:
    service, repository, payload = _setup()
    repository.create_lead.return_value = None
    with pytest.raises(ApplicationError) as caught:
        await service.submit(payload, idempotency_key=None, client_ip="127.0.0.1", user_agent="")
    assert caught.value.code == "CONSULTATION_REFERENCE_UNAVAILABLE"
    assert repository.create_lead.await_count == 5
    repository.record_consent.assert_not_awaited()
    repository.session.commit.assert_not_awaited()
    repository.session.rollback.assert_awaited_once()


async def test_other_integrity_errors_are_not_retried_as_reference_collisions() -> None:
    service, repository, payload = _setup()
    repository.create_lead.side_effect = IntegrityError("insert", {}, ValueError("invalid data"))
    with pytest.raises(ApplicationError) as caught:
        await service.submit(payload, idempotency_key=None, client_ip="127.0.0.1", user_agent="")
    assert caught.value.code == "CONSULTATION_SUBMISSION_CONFLICT"
    repository.create_lead.assert_awaited_once()
    repository.session.rollback.assert_awaited_once()


async def test_duplicate_submission_preserves_existing_long_reference() -> None:
    service, repository, payload = _setup()
    legacy = LeadRecord(uuid4(), "JA-ABCDEFGHIJKLMNOP", datetime.now(UTC))
    repository.find_duplicate.return_value = legacy
    result = await service.submit(
        payload, idempotency_key=None, client_ip="127.0.0.1", user_agent=""
    )
    assert result.receipt.reference == legacy.public_reference
    assert result.receipt.duplicate
    repository.create_lead.assert_not_awaited()


async def test_idempotent_retry_preserves_existing_long_reference() -> None:
    service, repository, payload = _setup()
    legacy_reference = "JA-ABCDEFGHIJKLMNOP"
    repository.get_idempotency.return_value = IdempotencyRecord(
        request_hash=service._request_hash(payload, payload.mobile),
        response_status=201,
        response_body={
            "reference": legacy_reference,
            "duplicate": False,
            "receivedAt": datetime.now(UTC).isoformat(),
            "message": "Received",
        },
    )
    result = await service.submit(
        payload, idempotency_key="existing-request-key", client_ip="127.0.0.1", user_agent=""
    )
    assert result.receipt.reference == legacy_reference
    repository.create_lead.assert_not_awaited()
