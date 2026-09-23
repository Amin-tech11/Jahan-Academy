from __future__ import annotations

import httpx

from app.modules.integrations.contracts import (
    NouraCreateResult,
    NouraLeadInput,
    PermanentNouraError,
    RetryableNouraError,
)


class HttpNouraLeadAdapter:
    def __init__(
        self,
        *,
        base_url: str,
        timeout_seconds: float,
        mock_outcome: str = "success",
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout_seconds
        self._mock_outcome = mock_outcome
        self._transport = transport

    async def create_lead(
        self,
        lead: NouraLeadInput,
        *,
        idempotency_key: str,
    ) -> NouraCreateResult:
        headers = {"Idempotency-Key": idempotency_key}
        if self._mock_outcome != "success":
            headers["X-Mock-Noura-Outcome"] = self._mock_outcome
        try:
            async with httpx.AsyncClient(
                base_url=self._base_url,
                timeout=self._timeout,
                transport=self._transport,
            ) as client:
                response = await client.post(
                    "/v1/leads",
                    json=lead.model_dump(mode="json"),
                    headers=headers,
                )
        except httpx.TimeoutException as exc:
            raise RetryableNouraError("NOURA_TIMEOUT") from exc
        except httpx.NetworkError as exc:
            raise RetryableNouraError("NOURA_NETWORK_ERROR") from exc

        if response.status_code in {408, 425, 429} or response.status_code >= 500:
            raise RetryableNouraError(f"NOURA_RETRYABLE_HTTP_{response.status_code}")
        if response.status_code >= 400:
            raise PermanentNouraError(f"NOURA_REJECTED_HTTP_{response.status_code}")
        try:
            return NouraCreateResult.model_validate(response.json())
        except (ValueError, TypeError) as exc:
            raise PermanentNouraError("NOURA_INVALID_RESPONSE") from exc
