from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import structlog
from sqlalchemy.exc import IntegrityError

from app.core.config import Settings
from app.modules.identity.mailer import AuthMailer
from app.modules.identity.repository import AccountRecord, AuthRepository
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


class AuthService:
    def __init__(
        self,
        repository: AuthRepository,
        security: AuthSecurity,
        mailer: AuthMailer,
        settings: Settings,
    ) -> None:
        self._repository = repository
        self._security = security
        self._mailer = mailer
        self._settings = settings

    async def register(self, request: RegisterRequest) -> None:
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
        email = self._normalize_email(str(request.email))
        account = await self._repository.get_account_by_email(email)
        if account is None or account.identity.password_hash is None:
            self._security.perform_dummy_password_check(request.password)
            raise self._invalid_credentials()

        now = datetime.now(UTC)
        if account.user.locked_until and account.user.locked_until > now:
            raise ApplicationError(
                code="ACCOUNT_LOCKED",
                message="The account is temporarily locked. Try again later.",
                status_code=403,
            )
        if not self._security.verify_password(account.identity.password_hash, request.password):
            await self._repository.register_failed_login(
                account.user,
                self._settings.login_max_attempts,
                timedelta(minutes=self._settings.login_lock_minutes),
            )
            await self._repository.session.commit()
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

        replacement_hash = None
        if self._security.password_needs_rehash(account.identity.password_hash):
            replacement_hash = self._security.hash_password(request.password)
        await self._repository.register_successful_login(account, replacement_hash)
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
        if record.session.expires_at <= now or record.user.status != "active":
            await self._repository.revoke_family(record.session.family_id)
            await self._repository.session.commit()
            raise self._invalid_refresh_token()

        account = await self._repository.get_account_by_user_id(record.user.id)
        if account is None:
            raise self._invalid_refresh_token()
        record.session.revoked_at = now
        record.session.rotated_at = now
        new_refresh = self._security.new_opaque_token()
        new_session = await self._repository.create_session(
            user_id=record.user.id,
            token_hash=self._security.token_hash(new_refresh),
            expires_at=now + timedelta(days=self._settings.refresh_token_days),
            ip_hash=self._security.fingerprint_hash(ip_address),
            user_agent=(user_agent or "")[:500] or None,
            family_id=record.session.family_id,
            parent_session_id=record.session.id,
        )
        access_token, access_expiry = self._security.create_access_token(
            account.user.id, new_session.id
        )
        csrf_token = self._security.new_opaque_token()
        await self._repository.session.commit()
        return IssuedTokens(
            view=self._token_view(account, access_token, access_expiry, csrf_token),
            refresh_token=new_refresh,
        )

    async def logout(self, claims: AccessClaims) -> None:
        await self._repository.revoke_session(claims.session_id)
        await self._repository.session.commit()

    async def authenticate(self, access_token: str) -> tuple[AccessClaims, UserView]:
        claims = self._security.decode_access_token(access_token)
        session = await self._repository.get_active_session(claims.session_id, claims.user_id)
        if session is None:
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
        return claims, self._user_view(account)

    async def request_password_reset(self, email_input: str) -> None:
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
        except Exception:
            logger.exception("password_reset_email_delivery_failed")

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
        session = await self._repository.create_session(
            user_id=account.user.id,
            token_hash=self._security.token_hash(refresh_token),
            expires_at=datetime.now(UTC) + timedelta(days=self._settings.refresh_token_days),
            ip_hash=self._security.fingerprint_hash(ip_address),
            user_agent=(user_agent or "")[:500] or None,
        )
        access_token, expires_at = self._security.create_access_token(account.user.id, session.id)
        csrf_token = self._security.new_opaque_token()
        return IssuedTokens(
            view=self._token_view(account, access_token, expires_at, csrf_token),
            refresh_token=refresh_token,
        )

    def _token_view(
        self,
        account: AccountRecord,
        access_token: str,
        expires_at: datetime,
        csrf_token: str,
    ) -> TokenView:
        return TokenView(
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
        except Exception:
            logger.exception("verification_email_delivery_failed")

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
