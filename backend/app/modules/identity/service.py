from __future__ import annotations

import hmac
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import structlog
from sqlalchemy.exc import IntegrityError

from app.core.config import Settings
from app.core.redis import get_redis
from app.modules.identity.abuse import AuthAbuseControl
from app.modules.identity.mailer import AuthMailer
from app.modules.identity.mfa import MfaSecurity
from app.modules.identity.repository import AccountRecord, AuthRepository, SessionRecord
from app.modules.identity.schemas import (
    LoginRequest,
    PasswordResetConfirmRequest,
    RegisterRequest,
    TokenView,
    UserView,
)
from app.modules.identity.security import AccessClaims, AuthSecurity, validate_password_strength
from app.shared.exceptions import ApplicationError

logger = structlog.get_logger()


@dataclass(frozen=True, slots=True)
class IssuedTokens:
    view: TokenView
    refresh_token: str
    refresh_expires_at: datetime | None = None


class AuthService:
    def __init__(
        self,
        repository: AuthRepository,
        security: AuthSecurity,
        mailer: AuthMailer,
        settings: Settings,
        abuse: AuthAbuseControl | None = None,
    ) -> None:
        self._repository = repository
        self._security = security
        self._mailer = mailer
        self._settings = settings
        self._abuse = abuse if abuse is not None else AuthAbuseControl(get_redis(), settings)

    async def register(self, request: RegisterRequest) -> None:
        self._require_email_delivery()
        validate_password_strength(request.password)
        email = self._normalize_email(str(request.email))
        if await self._repository.email_exists(email):
            raise ApplicationError(
                code="IDENTITY_ALREADY_EXISTS",
                message="An account already exists for this email.",
                status_code=409,
            )
        try:
            account = await self._repository.create_pending_user(
                email=email,
                password_hash=self._security.hash_password(request.password),
                first_name=request.first_name,
                last_name=request.last_name,
                locale=request.locale,
                terms_version=request.accepted_terms_version,
                privacy_version=request.accepted_privacy_version,
            )
            token = await self._new_email_challenge(account)
            await self._repository.session.commit()
        except IntegrityError as exc:
            await self._repository.session.rollback()
            if getattr(exc.orig, "sqlstate", None) == "23505":
                raise ApplicationError(
                    code="IDENTITY_ALREADY_EXISTS",
                    message="An account already exists for this email.",
                    status_code=409,
                ) from exc
            raise
        await self._send_verification(email, token)

    async def resend_email_verification(self, email_input: str) -> None:
        self._require_email_delivery()
        email = self._normalize_email(email_input)
        account = await self._repository.get_account_by_email(email)
        if account is None or account.identity.verified_at is not None:
            return
        token = await self._new_email_challenge(account)
        await self._repository.session.commit()
        await self._send_verification(email, token)

    async def verify_email(
        self, token: str, ip_address: str | None, user_agent: str | None
    ) -> IssuedTokens:
        account = await self._repository.consume_email_challenge(self._security.token_hash(token))
        if account is None:
            raise ApplicationError(
                code="EMAIL_VERIFICATION_TOKEN_INVALID",
                message="The email verification link is invalid or expired.",
                status_code=400,
            )
        issued = await self._issue_session(account, ip_address, user_agent)
        await self._repository.session.commit()
        return issued

    async def login(
        self, request: LoginRequest, ip_address: str | None, user_agent: str | None
    ) -> IssuedTokens:
        if request.username is not None:
            account = await self._repository.get_staff_account_by_username(
                request.username.casefold()
            )
        else:
            email = self._normalize_email(str(request.email))
            account = await self._repository.get_account_by_email(email)
        if account is None or account.identity.password_hash is None:
            self._security.perform_dummy_password_check(request.password)
            raise self._invalid_credentials()

        now = datetime.now(UTC)
        await self._abuse.check_account("login", account.user.id)
        if account.user.locked_until and account.user.locked_until > now:
            self._security.perform_dummy_password_check(request.password)
            raise self._invalid_credentials()
        if not self._security.verify_password(account.identity.password_hash, request.password):
            await self._record_mfa_failure(account)
            raise self._invalid_credentials()
        if account.identity.verified_at is None or account.user.status == "pending":
            raise ApplicationError(
                code="EMAIL_NOT_VERIFIED",
                message="Verify your email before signing in.",
                status_code=403,
            )
        if account.user.status != "active":
            raise ApplicationError(
                code="ACCOUNT_UNAVAILABLE",
                message="The account is unavailable.",
                status_code=403,
            )

        mfa = await self._repository.mfa_record(account.user.id)
        if mfa and mfa["enabled"]:
            if not request.mfa_code:
                raise ApplicationError(
                    code="MFA_REQUIRED",
                    message="Enter your authenticator or recovery code.",
                    status_code=401,
                )
            await self._consume_mfa_proof(account, mfa, request.mfa_code)

        replacement_hash = None
        if self._security.password_needs_rehash(account.identity.password_hash):
            replacement_hash = self._security.hash_password(request.password)
        await self._repository.register_successful_login(account, replacement_hash)
        await self._abuse.clear_failures(account.user.id)
        issued = await self._issue_session(account, ip_address, user_agent)
        await self._repository.audit_login(
            user_id=account.user.id,
            ip_hash=self._security.fingerprint_hash(ip_address),
            user_agent=(user_agent or "")[:500] or None,
        )
        await self._repository.session.commit()
        return issued

    async def refresh(
        self, refresh_token: str, ip_address: str | None, user_agent: str | None
    ) -> IssuedTokens:
        record = await self._repository.get_refresh_session_for_update(
            self._security.token_hash(refresh_token)
        )
        if record is None:
            raise self._invalid_refresh_token()
        now = datetime.now(UTC)
        if record.session.revoked_at is not None:
            await self._repository.revoke_family(record.session.family_id)
            await self._repository.session.commit()
            raise ApplicationError(
                code="REFRESH_TOKEN_REUSED",
                message="The session is no longer valid. Sign in again.",
                status_code=401,
            )
        deadline = await self._session_deadline(record, now)
        if deadline is None or record.user.status != "active":
            await self._repository.revoke_family(record.session.family_id)
            await self._repository.session.commit()
            raise self._invalid_refresh_token()

        account = await self._repository.get_account_by_user_id(record.user.id)
        if account is None:
            raise self._invalid_refresh_token()
        await self._abuse.check_account("refresh", account.user.id)
        record.session.revoked_at = now
        record.session.rotated_at = now
        new_refresh = self._security.new_opaque_token()
        new_session = await self._repository.create_session(
            user_id=record.user.id,
            token_hash=self._security.token_hash(new_refresh),
            expires_at=deadline,
            ip_hash=self._security.fingerprint_hash(ip_address),
            user_agent=(user_agent or "")[:500] or None,
            family_id=record.session.family_id,
            parent_session_id=record.session.id,
        )
        # Rotation is background work, not evidence of human activity.
        new_session.last_seen_at = record.session.last_seen_at
        access_token, access_expiry = self._security.create_access_token(
            account.user.id, new_session.id, expires_at_limit=deadline
        )
        csrf_token = self._security.new_opaque_token()
        enrollment_required = await self._requires_mfa_enrollment(account.user.id)
        await self._repository.session.commit()
        return IssuedTokens(
            view=self._token_view(
                account, access_token, access_expiry, csrf_token, enrollment_required
            ),
            refresh_token=new_refresh,
            refresh_expires_at=deadline,
        )

    async def logout(self, claims: AccessClaims) -> None:
        await self._repository.revoke_session(claims.session_id)
        await self._repository.session.commit()

    async def authenticate(
        self, access_token: str, *, allow_mfa_enrollment: bool = False
    ) -> tuple[AccessClaims, UserView]:
        claims = self._security.decode_access_token(access_token)
        session = await self._repository.get_active_session(claims.session_id, claims.user_id)
        if session is None:
            raise ApplicationError(
                code="SESSION_EXPIRED",
                message="The session is invalid or expired.",
                status_code=401,
            )
        now = datetime.now(UTC)
        if await self._session_deadline(session, now) is None:
            await self._repository.revoke_family(session.session.family_id)
            await self._repository.session.commit()
            raise ApplicationError(
                code="SESSION_EXPIRED",
                message="The session is invalid or expired.",
                status_code=401,
            )
        account = await self._repository.get_account_by_user_id(claims.user_id)
        if account is None:
            raise ApplicationError(
                code="AUTHENTICATION_REQUIRED",
                message="Authentication is required.",
                status_code=401,
            )
        # Re-check current roles and enrollment for every request, including old sessions.
        # Enrollment-only access must never reach panel data or privilege management.
        if not allow_mfa_enrollment and await self._requires_mfa_enrollment(claims.user_id):
            raise ApplicationError(
                code="MFA_ENROLLMENT_REQUIRED",
                message="Set up multi-factor authentication before accessing the panel.",
                status_code=403,
            )
        await self._repository.session.commit()
        return claims, self._user_view(account)

    async def activity(self, claims: AccessClaims) -> None:
        record = await self._repository.get_active_session(claims.session_id, claims.user_id)
        now = datetime.now(UTC)
        if record is None or await self._session_deadline(record, now) is None:
            raise ApplicationError("SESSION_EXPIRED", "The session expired.", 401)
        record.session.last_seen_at = now
        await self._repository.session.commit()

    async def reauthenticate(
        self,
        claims: AccessClaims,
        password: str,
        code: str,
        method: str,
        path: str,
    ) -> str:
        from app.modules.identity.reauth import issue

        account = await self._repository.get_account_by_user_id(claims.user_id)
        if account is None:
            raise self._invalid_credentials()
        account = await self._fresh_account(account.identity.provider_subject, password)
        mfa = await self._repository.mfa_record(account.user.id)
        if not mfa or not mfa["enabled"]:
            raise ApplicationError("MFA_ENROLLMENT_REQUIRED", "Enroll MFA first.", 403)
        await self._consume_mfa_proof(account, mfa, code)
        await self._abuse.clear_failures(account.user.id)
        await self._repository.audit_mfa(account.user.id, "auth.reauthenticated")
        await self._repository.session.commit()
        return await issue(get_redis(), claims, method, path)

    async def _session_limits(self, user_id: UUID) -> tuple[timedelta, timedelta]:
        if await self._repository.requires_staff_mfa(user_id):
            return (
                timedelta(minutes=self._settings.staff_session_idle_minutes),
                timedelta(hours=self._settings.staff_session_absolute_hours),
            )
        return (
            timedelta(minutes=self._settings.session_idle_minutes),
            timedelta(hours=self._settings.session_absolute_hours),
        )

    async def _session_deadline(self, record: SessionRecord, now: datetime) -> datetime | None:
        idle, absolute = await self._session_limits(record.user.id)
        started = await self._repository.session_family_started_at(
            record.session.family_id, record.user.id
        )
        if started is None or record.session.last_seen_at + idle <= now:
            return None
        deadline = min(record.session.expires_at, started + absolute)
        return deadline if now < deadline else None

    async def _requires_mfa_enrollment(self, user_id: UUID) -> bool:
        if not await self._repository.requires_staff_mfa(user_id):
            return False
        record = await self._repository.mfa_record(user_id)
        return not record or not record["enabled"]

    async def request_password_reset(self, email_input: str) -> None:
        self._require_email_delivery()
        email = self._normalize_email(email_input)
        account = await self._repository.get_account_by_email(email)
        if account is None or account.identity.verified_at is None:
            return
        token = self._security.new_opaque_token()
        await self._repository.create_password_reset(
            account.identity.id,
            self._security.token_hash(token),
            datetime.now(UTC) + timedelta(minutes=self._settings.password_reset_minutes),
        )
        await self._repository.session.commit()
        try:
            await self._mailer.send_password_reset(email, token)
        except Exception as error:
            logger.error("password_reset_email_delivery_failed", error_type=type(error).__name__)

    async def reset_password(self, request: PasswordResetConfirmRequest) -> None:
        validate_password_strength(request.new_password)
        account = await self._repository.consume_password_reset(
            self._security.token_hash(request.token),
            self._security.hash_password(request.new_password),
        )
        if account is None:
            raise ApplicationError(
                code="PASSWORD_RESET_TOKEN_INVALID",
                message="The password reset link is invalid or expired.",
                status_code=400,
            )
        await self._repository.revoke_all_user_sessions(account.user.id)
        await self._abuse.clear_failures(account.user.id)
        await self._repository.session.commit()

    async def mfa_status(self, user_id: UUID) -> dict[str, object]:
        record = await self._repository.mfa_record(user_id)
        return {
            "required": await self._repository.requires_staff_mfa(user_id),
            "enabled": bool(record and record["enabled"]),
            "recoveryCodesRemaining": len(record["recovery_hashes"])
            if record and record["enabled"]
            else 0,
        }

    async def _fresh_account(self, email: str, password: str) -> AccountRecord:
        account = await self._repository.get_account_by_email(email)
        if (
            account is None
            or account.user.status != "active"
            or account.identity.password_hash is None
        ):
            raise self._invalid_credentials()
        if account.user.locked_until and account.user.locked_until > datetime.now(UTC):
            raise ApplicationError(
                code="ACCOUNT_LOCKED", message="Account temporarily locked.", status_code=403
            )
        if not self._security.verify_password(account.identity.password_hash, password):
            await self._record_mfa_failure(account)
            raise self._invalid_credentials()
        return account

    async def _record_mfa_failure(self, account: AccountRecord) -> None:
        count, lock_seconds = await self._abuse.register_failure(account.user.id)
        await self._repository.register_failed_login(
            account.user,
            count,
            timedelta(seconds=lock_seconds),
        )
        await self._repository.session.commit()

    async def mfa_setup(self, email: str, password: str) -> dict[str, str]:
        account = await self._fresh_account(email, password)
        record = await self._repository.mfa_record(account.user.id)
        if record and record["enabled"]:
            raise ApplicationError(
                code="MFA_ALREADY_ENABLED", message="MFA is already enabled.", status_code=409
            )
        security = MfaSecurity(self._settings)
        secret = security.new_secret()
        await self._repository.save_mfa_setup(account.user.id, security.encrypt(secret))
        await self._repository.audit_mfa(account.user.id, "auth.mfa.setup")
        await self._repository.session.commit()
        return {"secret": secret, "otpauthUri": security.uri(secret, email)}

    async def mfa_confirm(self, email: str, password: str, code: str) -> list[str]:
        account = await self._fresh_account(email, password)
        record = await self._repository.mfa_record(account.user.id)
        if not record or record["enabled"] or record["setup_expires_at"] <= datetime.now(UTC):
            raise ApplicationError(
                code="MFA_SETUP_EXPIRED", message="Start a new MFA setup.", status_code=400
            )
        security = MfaSecurity(self._settings)
        counter = security.verify(security.decrypt(record["secret_ciphertext"]), code, -1)
        if counter is None:
            await self._record_mfa_failure(account)
            raise ApplicationError(
                code="MFA_INVALID", message="The authenticator code is invalid.", status_code=401
            )
        codes = [self._security.new_opaque_token()[:32] for _ in range(10)]
        await self._repository.update_mfa_proof(
            account.user.id, counter, [self._security.token_hash(value) for value in codes]
        )
        await self._repository.revoke_all_user_sessions(account.user.id)
        await self._repository.audit_mfa(account.user.id, "auth.mfa.enabled")
        await self._repository.session.commit()
        return codes

    async def _consume_mfa_proof(
        self, account: AccountRecord, record: dict[str, Any], code: str
    ) -> None:
        security = MfaSecurity(self._settings)
        counter = security.verify(
            security.decrypt(record["secret_ciphertext"]), code, record["last_counter"]
        )
        hashes: list[str] = list(record["recovery_hashes"])
        if counter is None:
            digest = self._security.token_hash(code)
            matching = next((value for value in hashes if hmac.compare_digest(value, digest)), None)
            if matching is None:
                await self._record_mfa_failure(account)
                raise ApplicationError(
                    code="MFA_INVALID",
                    message="The authenticator or recovery code is invalid.",
                    status_code=401,
                )
            hashes.remove(matching)
            counter = record["last_counter"]
            await self._repository.audit_mfa(account.user.id, "auth.mfa.recovery_used")
        await self._repository.update_mfa_proof(account.user.id, counter, hashes)

    async def mfa_disable(self, email: str, password: str, code: str) -> None:
        account = await self._fresh_account(email, password)
        if await self._repository.requires_staff_mfa(account.user.id):
            raise ApplicationError(
                code="MFA_REQUIRED_FOR_STAFF",
                message="Staff accounts must keep multi-factor authentication enabled.",
                status_code=403,
            )
        record = await self._repository.mfa_record(account.user.id)
        if not record or not record["enabled"]:
            raise ApplicationError(
                code="MFA_NOT_ENABLED", message="MFA is not enabled.", status_code=409
            )
        await self._consume_mfa_proof(account, record, code)
        await self._repository.delete_mfa(account.user.id)
        await self._repository.revoke_all_user_sessions(account.user.id)
        await self._repository.audit_mfa(account.user.id, "auth.mfa.disabled")
        await self._repository.session.commit()

    async def _new_email_challenge(self, account: AccountRecord) -> str:
        token = self._security.new_opaque_token()
        await self._repository.create_email_challenge(
            user_id=account.user.id,
            identity_id=account.identity.id,
            destination_hash=self._security.token_hash(account.identity.provider_subject),
            secret_hash=self._security.token_hash(token),
            expires_at=datetime.now(UTC) + timedelta(hours=self._settings.email_verification_hours),
        )
        return token

    async def _issue_session(
        self, account: AccountRecord, ip_address: str | None, user_agent: str | None
    ) -> IssuedTokens:
        refresh_token = self._security.new_opaque_token()
        _, absolute = await self._session_limits(account.user.id)
        deadline = datetime.now(UTC) + min(
            absolute, timedelta(days=self._settings.refresh_token_days)
        )
        session = await self._repository.create_session(
            user_id=account.user.id,
            token_hash=self._security.token_hash(refresh_token),
            expires_at=deadline,
            ip_hash=self._security.fingerprint_hash(ip_address),
            user_agent=(user_agent or "")[:500] or None,
        )
        access_token, expires_at = self._security.create_access_token(
            account.user.id, session.id, expires_at_limit=deadline
        )
        csrf_token = self._security.new_opaque_token()
        return IssuedTokens(
            view=self._token_view(
                account,
                access_token,
                expires_at,
                csrf_token,
                await self._requires_mfa_enrollment(account.user.id),
            ),
            refresh_token=refresh_token,
            refresh_expires_at=deadline,
        )

    def _token_view(
        self,
        account: AccountRecord,
        access_token: str,
        expires_at: datetime,
        csrf_token: str,
        enrollment_required: bool = False,
    ) -> TokenView:
        return TokenView(
            mfa_enrollment_required=enrollment_required,
            access_token=access_token,
            expires_at=expires_at,
            csrf_token=csrf_token,
            user=self._user_view(account),
        )

    @staticmethod
    def _user_view(account: AccountRecord) -> UserView:
        return UserView(
            id=account.user.id,
            email=account.identity.provider_subject,
            first_name=account.profile.first_name,
            last_name=account.profile.last_name,
            preferred_locale=account.user.preferred_locale,
            email_verified=account.identity.verified_at is not None,
            status=account.user.status,
        )

    async def _send_verification(self, email: str, token: str) -> None:
        try:
            await self._mailer.send_email_verification(email, token)
        except Exception as error:
            logger.error("verification_email_delivery_failed", error_type=type(error).__name__)

    def _require_email_delivery(self) -> None:
        if not self._settings.email_delivery_enabled:
            raise ApplicationError(
                code="EMAIL_SERVICE_UNAVAILABLE",
                message="Email recovery is temporarily unavailable. Contact the administrator.",
                status_code=503,
            )

    @staticmethod
    def _normalize_email(email: str) -> str:
        return email.strip().casefold()

    @staticmethod
    def _invalid_credentials() -> ApplicationError:
        return ApplicationError(
            code="INVALID_CREDENTIALS",
            message="The email or password is incorrect.",
            status_code=401,
        )

    @staticmethod
    def _invalid_refresh_token() -> ApplicationError:
        return ApplicationError(
            code="INVALID_REFRESH_TOKEN",
            message="The refresh token is invalid or expired.",
            status_code=401,
        )
