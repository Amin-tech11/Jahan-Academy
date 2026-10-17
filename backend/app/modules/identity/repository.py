from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, cast
from uuid import UUID, uuid4

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity.domain import STAFF_ROLE_CODES
from app.modules.identity.models import (
    AuthChallengeModel,
    PasswordResetTokenModel,
    SessionModel,
    UserIdentityModel,
    UserModel,
    UserProfileModel,
)


@dataclass(frozen=True, slots=True)
class AccountRecord:
    user: UserModel
    identity: UserIdentityModel
    profile: UserProfileModel


@dataclass(frozen=True, slots=True)
class SessionRecord:
    session: SessionModel
    user: UserModel


class AuthRepository:
    async def requires_staff_mfa(self, user_id: UUID) -> bool:
        return bool(
            await self.session.scalar(
                text("""SELECT EXISTS (
                SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = :id AND ur.revoked_at IS NULL
                  AND r.code = ANY(:roles)
            )"""),
                {"id": user_id, "roles": sorted(STAFF_ROLE_CODES)},
            )
        )

    async def mfa_record(self, user_id: UUID) -> dict[str, Any] | None:
        row = (
            (
                await self.session.execute(
                    text("SELECT * FROM user_mfa WHERE user_id = :id FOR UPDATE"), {"id": user_id}
                )
            )
            .mappings()
            .one_or_none()
        )
        return dict(row) if row else None

    async def save_mfa_setup(self, user_id: UUID, ciphertext: str) -> None:
        await self.session.execute(
            text("""INSERT INTO user_mfa (user_id, secret_ciphertext, setup_expires_at)
                 VALUES (:id, :secret, now() + interval '15 minutes')
                 ON CONFLICT (user_id) DO UPDATE SET secret_ciphertext = :secret,
                 setup_expires_at = now() + interval '15 minutes', last_counter = -1,
                 recovery_hashes = '{}', updated_at = now() WHERE NOT user_mfa.enabled"""),
            {"id": user_id, "secret": ciphertext},
        )

    async def update_mfa_proof(
        self, user_id: UUID, counter: int, recovery_hashes: list[str], *, enable: bool = True
    ) -> None:
        await self.session.execute(
            text("""UPDATE user_mfa SET last_counter = :counter,
                 recovery_hashes = CAST(:hashes AS text[]), enabled = :enabled,
                 updated_at = now() WHERE user_id = :id"""),
            {"id": user_id, "counter": counter, "hashes": recovery_hashes, "enabled": enable},
        )

    async def delete_mfa(self, user_id: UUID) -> None:
        await self.session.execute(
            text("DELETE FROM user_mfa WHERE user_id = :id"), {"id": user_id}
        )

    async def audit_mfa(self, user_id: UUID, action: str) -> None:
        await self.session.execute(
            text("""INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id)
                 VALUES (:id, :action, 'user', :id)"""),
            {"id": user_id, "action": action},
        )

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def email_exists(self, normalized_email: str) -> bool:
        statement = select(UserIdentityModel.id).where(
            UserIdentityModel.provider == "email",
            UserIdentityModel.normalized_value == normalized_email,
        )
        return (await self.session.scalar(statement)) is not None

    async def create_pending_user(
        self,
        *,
        email: str,
        password_hash: str,
        first_name: str,
        last_name: str,
        locale: str,
        terms_version: str,
        privacy_version: str,
    ) -> AccountRecord:
        now = datetime.now(UTC)
        user = UserModel(
            id=uuid4(),
            status="pending",
            preferred_locale=locale,
            failed_login_count=0,
            locked_until=None,
            created_at=now,
            updated_at=now,
            deleted_at=None,
        )
        profile = UserProfileModel(
            user_id=user.id,
            first_name=first_name,
            last_name=last_name,
            created_at=now,
            updated_at=now,
        )
        identity = UserIdentityModel(
            id=uuid4(),
            user_id=user.id,
            provider="email",
            provider_subject=email,
            normalized_value=email,
            password_hash=password_hash,
            verified_at=None,
            last_used_at=None,
            created_at=now,
            updated_at=now,
        )
        # The mappings intentionally avoid ORM relationships; flush the parent explicitly so
        # SQLAlchemy does not have to infer insert order from relationship metadata.
        self.session.add(user)
        await self.session.flush()
        self.session.add_all([profile, identity])
        await self.session.flush()
        await self.session.execute(
            text(
                "INSERT INTO user_roles (user_id, role_id) "
                "SELECT :user_id, id FROM roles WHERE code = 'user'"
            ),
            {"user_id": user.id},
        )
        for consent_type, policy_version in (
            ("terms", terms_version),
            ("privacy", privacy_version),
        ):
            await self.session.execute(
                text(
                    "INSERT INTO consent_records "
                    "(user_id, consent_type, policy_version, granted, locale, source) "
                    "VALUES (:user_id, :consent_type, :policy_version, true, :locale, 'register')"
                ),
                {
                    "user_id": user.id,
                    "consent_type": consent_type,
                    "policy_version": policy_version,
                    "locale": locale,
                },
            )
        return AccountRecord(user=user, identity=identity, profile=profile)

    async def get_account_by_email(self, normalized_email: str) -> AccountRecord | None:
        statement = (
            select(UserModel, UserIdentityModel, UserProfileModel)
            .join(UserIdentityModel, UserIdentityModel.user_id == UserModel.id)
            .join(UserProfileModel, UserProfileModel.user_id == UserModel.id)
            .where(
                UserIdentityModel.provider == "email",
                UserIdentityModel.normalized_value == normalized_email,
                UserModel.deleted_at.is_(None),
            )
            .with_for_update(of=UserModel)
            .execution_options(populate_existing=True)
        )
        row = (await self.session.execute(statement)).one_or_none()
        return None if row is None else AccountRecord(user=row[0], identity=row[1], profile=row[2])

    async def get_staff_account_by_username(self, username: str) -> AccountRecord | None:
        user_id = await self.session.scalar(
            text("""
            SELECT a.user_id FROM staff_login_names a
            WHERE a.username = :username AND EXISTS (
                SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = a.user_id AND ur.scope_type = 'global'
                  AND ur.revoked_at IS NULL
                  AND r.code IN ('super_admin', 'support', 'consultant', 'content_editor')
            )
        """),
            {"username": username},
        )
        if user_id is None:
            return None
        account = await self.get_account_by_user_id(user_id)
        if account is None:
            return None
        return await self.get_account_by_email(account.identity.provider_subject)

    async def get_account_by_user_id(self, user_id: UUID) -> AccountRecord | None:
        statement = (
            select(UserModel, UserIdentityModel, UserProfileModel)
            .join(UserIdentityModel, UserIdentityModel.user_id == UserModel.id)
            .join(UserProfileModel, UserProfileModel.user_id == UserModel.id)
            .where(
                UserModel.id == user_id,
                UserIdentityModel.provider == "email",
                UserModel.deleted_at.is_(None),
            )
        )
        row = (await self.session.execute(statement)).one_or_none()
        return None if row is None else AccountRecord(user=row[0], identity=row[1], profile=row[2])

    async def create_email_challenge(
        self,
        *,
        user_id: UUID,
        identity_id: UUID,
        destination_hash: str,
        secret_hash: str,
        expires_at: datetime,
    ) -> None:
        now = datetime.now(UTC)
        await self.session.execute(
            update(AuthChallengeModel)
            .where(
                AuthChallengeModel.identity_id == identity_id,
                AuthChallengeModel.purpose == "verify_email",
                AuthChallengeModel.consumed_at.is_(None),
            )
            .values(consumed_at=now)
        )
        self.session.add(
            AuthChallengeModel(
                id=uuid4(),
                user_id=user_id,
                identity_id=identity_id,
                purpose="verify_email",
                destination_hash=destination_hash,
                secret_hash=secret_hash,
                attempt_count=0,
                max_attempts=5,
                expires_at=expires_at,
                consumed_at=None,
                created_at=now,
            )
        )

    async def consume_email_challenge(self, secret_hash: str) -> AccountRecord | None:
        now = datetime.now(UTC)
        statement = (
            select(AuthChallengeModel, UserModel, UserIdentityModel, UserProfileModel)
            .join(UserIdentityModel, UserIdentityModel.id == AuthChallengeModel.identity_id)
            .join(UserModel, UserModel.id == UserIdentityModel.user_id)
            .join(UserProfileModel, UserProfileModel.user_id == UserModel.id)
            .where(
                AuthChallengeModel.purpose == "verify_email",
                AuthChallengeModel.secret_hash == secret_hash,
                AuthChallengeModel.consumed_at.is_(None),
                AuthChallengeModel.expires_at > now,
                UserIdentityModel.verified_at.is_(None),
                UserModel.status == "pending",
                UserModel.deleted_at.is_(None),
            )
            .with_for_update()
        )
        row = (await self.session.execute(statement)).one_or_none()
        if row is None:
            return None
        challenge, user, identity, profile = row
        challenge.consumed_at = now
        identity.verified_at = now
        identity.updated_at = now
        user.status = "active"
        user.updated_at = now
        return AccountRecord(user=user, identity=identity, profile=profile)

    async def register_failed_login(
        self, user: UserModel, failure_count: int, lock_for: timedelta
    ) -> None:
        now = datetime.now(UTC)
        await self.session.execute(
            text("""UPDATE users SET
                 locked_until = :locked_until,
                 failed_login_count = :failure_count,
                 updated_at = :now WHERE id = :id"""),
            {
                "id": user.id,
                "failure_count": 0 if lock_for else failure_count,
                "locked_until": now + lock_for if lock_for else None,
                "now": now,
            },
        )
        await self.session.refresh(user)

    async def register_successful_login(
        self, account: AccountRecord, password_hash: str | None
    ) -> None:
        now = datetime.now(UTC)
        account.user.failed_login_count = 0
        account.user.locked_until = None
        account.user.updated_at = now
        account.identity.last_used_at = now
        account.identity.updated_at = now
        if password_hash is not None:
            account.identity.password_hash = password_hash

    async def audit_login(
        self, *, user_id: UUID, ip_hash: str | None, user_agent: str | None
    ) -> None:
        await self.session.execute(
            text(
                "INSERT INTO audit_logs "
                "(actor_user_id, action, entity_type, entity_id, ip_hash, user_agent) "
                "VALUES (:user_id, 'auth.login.succeeded', 'user', :user_id, :ip_hash, :user_agent)"
            ),
            {"user_id": user_id, "ip_hash": ip_hash, "user_agent": user_agent},
        )

    async def create_session(
        self,
        *,
        user_id: UUID,
        token_hash: str,
        expires_at: datetime,
        ip_hash: str | None,
        user_agent: str | None,
        family_id: UUID | None = None,
        parent_session_id: UUID | None = None,
    ) -> SessionModel:
        now = datetime.now(UTC)
        session_id = uuid4()
        session = SessionModel(
            id=session_id,
            user_id=user_id,
            token_hash=token_hash,
            family_id=family_id or session_id,
            parent_session_id=parent_session_id,
            ip_hash=ip_hash,
            user_agent=user_agent,
            expires_at=expires_at,
            last_seen_at=now,
            rotated_at=None,
            revoked_at=None,
            created_at=now,
        )
        self.session.add(session)
        await self.session.flush()
        return session

    async def get_refresh_session_for_update(self, token_hash: str) -> SessionRecord | None:
        # Match login/MFA's lock order: account first, then session. This serializes
        # enrollment/revocation with refresh, including sessions created concurrently.
        await self.session.execute(
            select(UserModel)
            .join(SessionModel, SessionModel.user_id == UserModel.id)
            .where(SessionModel.token_hash == token_hash)
            .with_for_update(of=UserModel)
        )
        statement = (
            select(SessionModel, UserModel)
            .join(UserModel, UserModel.id == SessionModel.user_id)
            .where(SessionModel.token_hash == token_hash)
            .with_for_update()
        )
        row = (await self.session.execute(statement)).one_or_none()
        return None if row is None else SessionRecord(session=row[0], user=row[1])

    async def get_active_session(self, session_id: UUID, user_id: UUID) -> SessionRecord | None:
        # Same lock order as refresh/MFA: user, then session. Persisting activity must
        # not race a refresh that revokes this session or another sensitive action.
        await self.session.execute(
            select(UserModel).where(UserModel.id == user_id).with_for_update()
        )
        now = datetime.now(UTC)
        statement = (
            select(SessionModel, UserModel)
            .join(UserModel, UserModel.id == SessionModel.user_id)
            .where(
                SessionModel.id == session_id,
                SessionModel.user_id == user_id,
                SessionModel.revoked_at.is_(None),
                SessionModel.expires_at > now,
                UserModel.status == "active",
                UserModel.deleted_at.is_(None),
            )
            .with_for_update(of=SessionModel)
            .execution_options(populate_existing=True)
        )
        row = (await self.session.execute(statement)).one_or_none()
        return None if row is None else SessionRecord(session=row[0], user=row[1])

    async def session_family_started_at(self, family_id: UUID, user_id: UUID) -> datetime | None:
        # Rotation retains the original row. Its timestamp, never the child's,
        # defines the absolute lifetime, including for pre-policy sessions.
        return cast(
            datetime | None,
            await self.session.scalar(
                select(SessionModel.created_at).where(
                    SessionModel.id == family_id, SessionModel.user_id == user_id
                )
            ),
        )

    async def revoke_session(self, session_id: UUID) -> None:
        await self.session.execute(
            update(SessionModel)
            .where(SessionModel.id == session_id, SessionModel.revoked_at.is_(None))
            .values(revoked_at=datetime.now(UTC))
        )

    async def revoke_family(self, family_id: UUID) -> None:
        await self.session.execute(
            update(SessionModel)
            .where(SessionModel.family_id == family_id, SessionModel.revoked_at.is_(None))
            .values(revoked_at=datetime.now(UTC))
        )

    async def revoke_all_user_sessions(self, user_id: UUID) -> None:
        await self.session.execute(
            update(SessionModel)
            .where(SessionModel.user_id == user_id, SessionModel.revoked_at.is_(None))
            .values(revoked_at=datetime.now(UTC))
        )

    async def create_password_reset(
        self, identity_id: UUID, token_hash: str, expires_at: datetime
    ) -> None:
        now = datetime.now(UTC)
        await self.session.execute(
            update(PasswordResetTokenModel)
            .where(
                PasswordResetTokenModel.identity_id == identity_id,
                PasswordResetTokenModel.used_at.is_(None),
            )
            .values(used_at=now)
        )
        self.session.add(
            PasswordResetTokenModel(
                id=uuid4(),
                identity_id=identity_id,
                token_hash=token_hash,
                expires_at=expires_at,
                used_at=None,
                created_at=now,
            )
        )

    async def consume_password_reset(
        self, token_hash: str, new_password_hash: str
    ) -> AccountRecord | None:
        now = datetime.now(UTC)
        statement = (
            select(PasswordResetTokenModel, UserIdentityModel, UserModel, UserProfileModel)
            .join(UserIdentityModel, UserIdentityModel.id == PasswordResetTokenModel.identity_id)
            .join(UserModel, UserModel.id == UserIdentityModel.user_id)
            .join(UserProfileModel, UserProfileModel.user_id == UserModel.id)
            .where(
                PasswordResetTokenModel.token_hash == token_hash,
                PasswordResetTokenModel.used_at.is_(None),
                PasswordResetTokenModel.expires_at > now,
            )
            .with_for_update()
        )
        row = (await self.session.execute(statement)).one_or_none()
        if row is None:
            return None
        reset_token, identity, user, profile = row
        reset_token.used_at = now
        identity.password_hash = new_password_hash
        identity.updated_at = now
        user.failed_login_count = 0
        user.locked_until = None
        user.updated_at = now
        return AccountRecord(user=user, identity=identity, profile=profile)
