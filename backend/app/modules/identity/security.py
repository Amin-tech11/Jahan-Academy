from __future__ import annotations

import hashlib
import hmac
import json
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from functools import lru_cache
from pathlib import Path
from uuid import UUID, uuid4

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.core.config import Settings
from app.shared.exceptions import ApplicationError


@dataclass(frozen=True, slots=True)
class AccessClaims:
    user_id: UUID
    session_id: UUID
    expires_at: datetime


class AuthSecurity:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._passwords = PasswordHasher(
            time_cost=3,
            memory_cost=65536,
            parallelism=4,
            hash_len=32,
            salt_len=16,
        )
        # Fixed dummy hash, never an account credential. Construction allocates no Argon2 work.
        self._dummy_password_hash = (
            "$argon2id$v=19$m=65536,t=3,p=4$3olKu4BAEgr/AdqoUm+0Cg$"
            "Pmmb6TdNACtLAXuBU02Nx8N/1j6+L3y2DIdNd/IfZ9I"
        )

    def hash_password(self, password: str) -> str:
        return self._passwords.hash(password)

    def verify_password(self, password_hash: str, password: str) -> bool:
        try:
            return self._passwords.verify(password_hash, password)
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            return False

    def password_needs_rehash(self, password_hash: str) -> bool:
        return self._passwords.check_needs_rehash(password_hash)

    def perform_dummy_password_check(self, password: str) -> None:
        self.verify_password(self._dummy_password_hash, password)

    @staticmethod
    def new_opaque_token() -> str:
        return secrets.token_urlsafe(48)

    @staticmethod
    def token_hash(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    @staticmethod
    def fingerprint_hash(value: str | None) -> str | None:
        if not value:
            return None
        return hashlib.sha256(value.encode("utf-8")).hexdigest()

    @staticmethod
    def constant_time_equal(left: str, right: str) -> bool:
        return hmac.compare_digest(left.encode("utf-8"), right.encode("utf-8"))

    def create_access_token(
        self, user_id: UUID, session_id: UUID, *, expires_at_limit: datetime | None = None
    ) -> tuple[str, datetime]:
        now = datetime.now(UTC)
        expires_at = now + timedelta(minutes=self._settings.access_token_minutes)
        if expires_at_limit is not None:
            expires_at = min(expires_at, expires_at_limit)
        payload = {
            "sub": str(user_id),
            "sid": str(session_id),
            "typ": "access",
            "jti": str(uuid4()),
            "iss": self._settings.jwt_issuer,
            "aud": self._settings.jwt_audience,
            "iat": now,
            "nbf": now,
            "exp": expires_at,
        }
        token = jwt.encode(
            payload,
            self._settings.session_secret.get_secret_value(),
            algorithm="HS256",
        )
        return token, expires_at

    def decode_access_token(self, token: str) -> AccessClaims:
        try:
            payload = jwt.decode(
                token,
                self._settings.session_secret.get_secret_value(),
                algorithms=["HS256"],
                audience=self._settings.jwt_audience,
                issuer=self._settings.jwt_issuer,
                options={"require": ["sub", "sid", "typ", "jti", "iat", "nbf", "exp"]},
            )
            if payload["typ"] != "access":
                raise jwt.InvalidTokenError
            return AccessClaims(
                user_id=UUID(payload["sub"]),
                session_id=UUID(payload["sid"]),
                expires_at=datetime.fromtimestamp(payload["exp"], UTC),
            )
        except (jwt.InvalidTokenError, KeyError, TypeError, ValueError) as exc:
            raise ApplicationError(
                code="INVALID_ACCESS_TOKEN",
                message="The access token is invalid or expired.",
                status_code=401,
            ) from exc


@lru_cache(maxsize=1)
def _common_password_hashes() -> frozenset[str]:
    try:
        document = json.loads(
            Path(__file__).with_name("password_blocklist.json").read_text(encoding="utf-8")
        )
        values = document["hashes"]
        if (
            not isinstance(values, list)
            or len(values) < 10000
            or any(
                not isinstance(value, str)
                or len(value) != 64
                or any(char not in "0123456789abcdef" for char in value)
                for value in values
            )
        ):
            raise ValueError("Invalid password blocklist")
        return frozenset(values)
    except (OSError, ValueError, KeyError, TypeError) as error:
        raise ApplicationError(
            "PASSWORD_POLICY_UNAVAILABLE",
            "Password validation is temporarily unavailable.",
            503,
        ) from error


def validate_password_strength(password: str) -> None:
    field_errors: dict[str, list[str]] = {}
    if not 15 <= len(password) <= 128:
        field_errors.setdefault("password", []).append("PASSWORD_LENGTH")
    elif (
        hashlib.sha256(password.casefold().encode("utf-8")).hexdigest() in _common_password_hashes()
    ):
        field_errors.setdefault("password", []).append("PASSWORD_COMMON_OR_COMPROMISED")
    if field_errors:
        raise ApplicationError(
            code="VALIDATION_ERROR",
            message="The password does not meet the security policy.",
            status_code=422,
            field_errors=field_errors,
        )
