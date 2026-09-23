from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class IntegrationModel(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True, extra="forbid")


class NouraRetryRequest(IntegrationModel):
    note: str | None = Field(default=None, min_length=3, max_length=500)

    @field_validator("note")
    @classmethod
    def strip_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if len(stripped) < 3:
            raise ValueError("note must contain at least three characters")
        return stripped


class NouraRetryReceipt(IntegrationModel):
    status: str
    attempt_count: int
    manual_retry_count: int
    next_attempt_at: datetime


class NouraRetryEnvelope(IntegrationModel):
    data: NouraRetryReceipt
