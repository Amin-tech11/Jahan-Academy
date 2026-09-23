from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal
from urllib.parse import urlsplit
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.modules.consultations.domain import (
    GenderCode,
    IntakeTerm,
    MaritalStatusCode,
    SourceEntityType,
)


def _to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=_to_camel,
        populate_by_name=True,
        extra="forbid",
        use_enum_values=True,
    )


class InvestmentBudget(ApiModel):
    range_code: str = Field(min_length=1, max_length=60, pattern=r"^[A-Za-z0-9_-]+$")
    currency: str = Field(pattern=r"^[A-Za-z]{3}$")

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()


class ConsultationSource(ApiModel):
    page_url: str = Field(min_length=1, max_length=2048)
    entity_type: SourceEntityType | None = None
    entity_id: UUID | None = None

    @field_validator("page_url")
    @classmethod
    def validate_same_site_path(cls, value: str) -> str:
        value = value.strip()
        parts = urlsplit(value)
        if (
            not value.startswith("/")
            or value.startswith("//")
            or "\\" in value
            or parts.scheme
            or parts.netloc
            or any(ord(character) < 32 for character in value)
        ):
            raise ValueError("pageUrl must be a same-site relative path")
        return value

    @model_validator(mode="after")
    def validate_entity_pair(self) -> ConsultationSource:
        if (self.entity_type is None) != (self.entity_id is None):
            raise ValueError("entityType and entityId must be provided together")
        return self


class ConsultationCreate(ApiModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    mobile: str = Field(min_length=7, max_length=32)
    email: EmailStr | None = Field(default=None, max_length=254)
    desired_country_id: UUID | None = None
    desired_country_text: str | None = Field(default=None, min_length=1, max_length=100)
    intake_term: IntakeTerm
    start_year: int
    age: int | None = Field(default=None, ge=18, le=100)
    gender: GenderCode | None = None
    gender_self_description: str | None = Field(default=None, min_length=1, max_length=100)
    occupation: str | None = Field(default=None, max_length=120)
    marital_status: MaritalStatusCode | None = None
    investment_budget: InvestmentBudget | None = None
    message: str | None = Field(default=None, max_length=2000)
    locale: Literal["fa", "en"]
    source: ConsultationSource
    privacy_consent: Literal[True]
    contact_consent: Literal[True]
    website: str | None = Field(default=None, max_length=200, exclude=True)

    @field_validator("intake_term", "gender", "marital_status", mode="before")
    @classmethod
    def normalize_enum_case(cls, value: object) -> object:
        return value.casefold() if isinstance(value, str) else value

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("value must not be blank")
        return stripped

    @field_validator(
        "desired_country_text",
        "gender_self_description",
        "occupation",
        "message",
    )
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr | None) -> str | None:
        return str(value).strip().casefold() if value is not None else None

    @field_validator("website")
    @classmethod
    def reject_filled_honeypot(cls, value: str | None) -> None:
        if value and value.strip():
            raise ValueError("value must be empty")
        return None

    @model_validator(mode="after")
    def validate_conditional_fields(self) -> ConsultationCreate:
        year = datetime.now(UTC).year
        if not year <= self.start_year <= year + 10:
            raise ValueError(f"startYear must be between {year} and {year + 10}")
        if (self.desired_country_id is None) == (self.desired_country_text is None):
            raise ValueError("Provide exactly one desired country ID or text value")
        if self.gender == GenderCode.SELF_DESCRIBED:
            if self.gender_self_description is None:
                raise ValueError("genderSelfDescription is required for self-described gender")
        elif self.gender_self_description is not None:
            raise ValueError("genderSelfDescription is only accepted for self-described gender")
        return self


class ConsultationReceipt(ApiModel):
    reference: str
    duplicate: bool
    received_at: datetime
    message: str


class ConsultationReceiptEnvelope(ApiModel):
    data: ConsultationReceipt
