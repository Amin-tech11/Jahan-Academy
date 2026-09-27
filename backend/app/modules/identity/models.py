from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import UUID as PgUuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(PgUuid(as_uuid=True), primary_key=True)
    status: Mapped[str] = mapped_column(String(24), default="pending")
    preferred_locale: Mapped[str] = mapped_column(String(5), default="fa")
    failed_login_count: Mapped[int] = mapped_column(SmallInteger, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    row_version: Mapped[int] = mapped_column(SmallInteger, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class UserProfileModel(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[UUID] = mapped_column(
        PgUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class UserIdentityModel(Base):
    __tablename__ = "user_identities"

    id: Mapped[UUID] = mapped_column(PgUuid(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        PgUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    provider: Mapped[str] = mapped_column(String(24))
    provider_subject: Mapped[str] = mapped_column(String(320))
    normalized_value: Mapped[str | None] = mapped_column(String(320))
    password_hash: Mapped[str | None] = mapped_column(Text)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class SessionModel(Base):
    __tablename__ = "sessions"

    id: Mapped[UUID] = mapped_column(PgUuid(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        PgUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    token_hash: Mapped[str] = mapped_column(String(128), unique=True)
    family_id: Mapped[UUID] = mapped_column(PgUuid(as_uuid=True))
    parent_session_id: Mapped[UUID | None] = mapped_column(
        PgUuid(as_uuid=True), ForeignKey("sessions.id", ondelete="SET NULL")
    )
    ip_hash: Mapped[str | None] = mapped_column(String(128))
    user_agent: Mapped[str | None] = mapped_column(String(500))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    rotated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class AuthChallengeModel(Base):
    __tablename__ = "auth_challenges"

    id: Mapped[UUID] = mapped_column(PgUuid(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID | None] = mapped_column(
        PgUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    identity_id: Mapped[UUID | None] = mapped_column(
        PgUuid(as_uuid=True), ForeignKey("user_identities.id", ondelete="CASCADE")
    )
    purpose: Mapped[str] = mapped_column(String(32))
    destination_hash: Mapped[str | None] = mapped_column(String(128))
    secret_hash: Mapped[str] = mapped_column(String(255))
    attempt_count: Mapped[int] = mapped_column(SmallInteger, default=0)
    max_attempts: Mapped[int] = mapped_column(SmallInteger, default=5)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class PasswordResetTokenModel(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[UUID] = mapped_column(PgUuid(as_uuid=True), primary_key=True)
    identity_id: Mapped[UUID] = mapped_column(
        PgUuid(as_uuid=True), ForeignKey("user_identities.id", ondelete="CASCADE")
    )
    token_hash: Mapped[str] = mapped_column(String(128), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
