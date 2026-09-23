from __future__ import annotations

from typing import Protocol
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class NouraLeadInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    lead_id: UUID
    reference: str
    first_name: str
    last_name: str
    mobile: str
    email: str | None = None
    desired_country: str | None = None
    intake: str | None = None
    start_year: int | None = None
    locale: str
    source_url: str | None = None


class NouraCreateResult(BaseModel):
    external_id: str


class NouraAdapterError(Exception):
    def __init__(self, safe_code: str) -> None:
        super().__init__(safe_code)
        self.safe_code = safe_code


class RetryableNouraError(NouraAdapterError):
    pass


class PermanentNouraError(NouraAdapterError):
    pass


class NouraLeadAdapter(Protocol):
    async def create_lead(
        self,
        lead: NouraLeadInput,
        *,
        idempotency_key: str,
    ) -> NouraCreateResult: ...
