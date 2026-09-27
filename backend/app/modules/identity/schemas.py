from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.modules.identity.domain import StaffRoleCode


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


class StaffCreateRequest(ApiModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    preferred_locale: str = Field(default="fa", pattern="^(fa|en)$")
    role_codes: list[StaffRoleCode] = Field(min_length=1, max_length=4)

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_staff_names(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("name must not be blank")
        return normalized

    @model_validator(mode="after")
    def unique_roles(self) -> StaffCreateRequest:
        if len(self.role_codes) != len(set(self.role_codes)):
            raise ValueError("roleCodes must not contain duplicates")
        return self


class StaffUpdateRequest(ApiModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    preferred_locale: str | None = Field(default=None, pattern="^(fa|en)$")
    active: bool | None = None

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_optional_staff_names(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("name must not be blank")
        return normalized

    @model_validator(mode="after")
    def requires_change(self) -> StaffUpdateRequest:
        if not self.model_fields_set:
            raise ValueError("at least one staff field must be provided")
        return self


class StaffRolesUpdateRequest(ApiModel):
    role_codes: list[StaffRoleCode] = Field(min_length=1, max_length=4)

    @model_validator(mode="after")
    def unique_roles(self) -> StaffRolesUpdateRequest:
        if len(self.role_codes) != len(set(self.role_codes)):
            raise ValueError("roleCodes must not contain duplicates")
        return self


class StaffAccessRecoveryRequest(ApiModel):
    reactivate: bool = False


class StaffRoleView(ApiModel):
    code: StaffRoleCode


class StaffView(ApiModel):
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    preferred_locale: str
    status: str
    active: bool
    email_verified: bool
    roles: list[StaffRoleView]
    locked_until: datetime | None = None
    created_at: datetime
    updated_at: datetime
    version: int


class StaffEnvelope(ApiModel):
    data: StaffView


class StaffPageMeta(ApiModel):
    page: int
    limit: int
    total: int
    total_pages: int


class StaffPage(ApiModel):
    data: list[StaffView]
    meta: StaffPageMeta
