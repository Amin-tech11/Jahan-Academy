from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def _to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=_to_camel,
        populate_by_name=True,
        extra="forbid",
    )


class RegisterRequest(ApiModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    locale: str = Field(default="fa", pattern="^(fa|en)$")
    accepted_terms_version: str = Field(min_length=1, max_length=32)
    accepted_privacy_version: str = Field(min_length=1, max_length=32)

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_names(cls, value: str) -> str:
        return value.strip()


class EmailRequest(ApiModel):
    email: EmailStr


class EmailVerificationRequest(ApiModel):
    token: str = Field(min_length=32, max_length=256)


class LoginRequest(ApiModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class PasswordResetConfirmRequest(ApiModel):
    token: str = Field(min_length=32, max_length=256)
    new_password: str = Field(min_length=12, max_length=128)


class UserView(ApiModel):
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    preferred_locale: str
    email_verified: bool
    status: str


class UserEnvelope(ApiModel):
    data: UserView


class RegistrationPending(ApiModel):
    email: EmailStr
    verification_required: bool = True


class RegistrationEnvelope(ApiModel):
    data: RegistrationPending


class Acknowledgement(ApiModel):
    accepted: bool = True


class AcknowledgementEnvelope(ApiModel):
    data: Acknowledgement


class TokenView(ApiModel):
    access_token: str
    token_type: str = "Bearer"
    expires_at: datetime
    csrf_token: str
    user: UserView


class TokenEnvelope(ApiModel):
    data: TokenView
