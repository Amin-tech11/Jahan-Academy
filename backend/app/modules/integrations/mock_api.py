from __future__ import annotations

import hashlib
from typing import Annotated

from fastapi import FastAPI, Header, HTTPException, Response, status

from app.modules.integrations.contracts import NouraCreateResult, NouraLeadInput

app = FastAPI(title="Jahan Academy Mock Noura", version="1.0.0")
_created: dict[str, NouraCreateResult] = {}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/leads", response_model=NouraCreateResult)
async def create_mock_lead(
    _: NouraLeadInput,
    response: Response,
    idempotency_key: Annotated[str, Header(alias="Idempotency-Key", min_length=16, max_length=140)],
    outcome: Annotated[
        str,
        Header(
            alias="X-Mock-Noura-Outcome",
            pattern="^(success|retryable_failure|permanent_failure)$",
        ),
    ] = "success",
) -> NouraCreateResult:
    if outcome == "retryable_failure":
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
    if outcome == "permanent_failure":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT)
    existing = _created.get(idempotency_key)
    if existing is not None:
        response.status_code = status.HTTP_200_OK
        return existing
    digest = hashlib.sha256(idempotency_key.encode()).hexdigest()[:24]
    created = NouraCreateResult(external_id=f"mock-noura-{digest}")
    _created[idempotency_key] = created
    response.status_code = status.HTTP_201_CREATED
    return created
