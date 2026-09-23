from datetime import timedelta
from uuid import uuid4

import httpx
import pytest

from app.modules.integrations.adapter import HttpNouraLeadAdapter
from app.modules.integrations.contracts import (
    NouraLeadInput,
    PermanentNouraError,
    RetryableNouraError,
)
from app.modules.integrations.mock_api import app as mock_noura_app
from app.modules.integrations.schemas import NouraRetryRequest
from app.modules.integrations.service import retry_delay_after


def _lead() -> NouraLeadInput:
    return NouraLeadInput(
        lead_id=uuid4(),
        reference="JA-TEST-001",
        first_name="Mina",
        last_name="Ahmadi",
        mobile="+989121234567",
        desired_country="Germany",
        intake="fall",
        start_year=2027,
        locale="fa",
        source_url="/fa/consultation",
    )


@pytest.mark.asyncio
async def test_mock_noura_is_idempotent_and_returns_external_id() -> None:
    adapter = HttpNouraLeadAdapter(
        base_url="http://mock-noura",
        timeout_seconds=1,
        transport=httpx.ASGITransport(app=mock_noura_app),
    )
    first = await adapter.create_lead(_lead(), idempotency_key="noura:lead:idempotent-001")
    second = await adapter.create_lead(_lead(), idempotency_key="noura:lead:idempotent-001")
    assert first.external_id.startswith("mock-noura-")
    assert second.external_id == first.external_id


@pytest.mark.asyncio
async def test_adapter_classifies_retryable_and_permanent_failures() -> None:
    transport = httpx.ASGITransport(app=mock_noura_app)
    retryable = HttpNouraLeadAdapter(
        base_url="http://mock-noura",
        timeout_seconds=1,
        mock_outcome="retryable_failure",
        transport=transport,
    )
    permanent = HttpNouraLeadAdapter(
        base_url="http://mock-noura",
        timeout_seconds=1,
        mock_outcome="permanent_failure",
        transport=transport,
    )
    with pytest.raises(RetryableNouraError, match="503"):
        await retryable.create_lead(_lead(), idempotency_key="noura:lead:retryable-001")
    with pytest.raises(PermanentNouraError, match="422"):
        await permanent.create_lead(_lead(), idempotency_key="noura:lead:permanent-001")


def test_retry_schedule_and_manual_note_validation() -> None:
    assert retry_delay_after(1) == timedelta(minutes=5)
    assert retry_delay_after(2) == timedelta(minutes=30)
    assert retry_delay_after(3) == timedelta(hours=2)
    assert retry_delay_after(4) == timedelta(hours=12)
    assert retry_delay_after(5) == timedelta(hours=24)
    assert retry_delay_after(6) is None
    assert NouraRetryRequest(note="  Retry after provider recovery  ").note == (
        "Retry after provider recovery"
    )
