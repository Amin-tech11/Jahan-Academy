from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
import pytest

from app.core.config import Settings
from app.modules.identity.security import AuthSecurity, validate_password_strength
from app.shared.exceptions import ApplicationError


@pytest.fixture
def security() -> AuthSecurity:
    return AuthSecurity(
        Settings(
            environment="test",
            session_secret="test-secret-that-is-longer-than-32-characters",
        )
    )


def test_argon2id_password_hashing_and_verification(security: AuthSecurity) -> None:
    encoded = security.hash_password("Correct-Horse-2026")

    assert encoded.startswith("$argon2id$")
    assert security.verify_password(encoded, "Correct-Horse-2026")
    assert not security.verify_password(encoded, "wrong-password")


def test_access_token_contains_required_claims(security: AuthSecurity) -> None:
    user_id = uuid4()
    session_id = uuid4()

    token, expires_at = security.create_access_token(user_id, session_id)
    claims = security.decode_access_token(token)

    assert claims.user_id == user_id
    assert claims.session_id == session_id
    assert claims.expires_at == expires_at.replace(microsecond=0)


def test_expired_access_token_is_rejected(security: AuthSecurity) -> None:
    settings = Settings(
        environment="test",
        session_secret="test-secret-that-is-longer-than-32-characters",
    )
    now = datetime.now(UTC)
    token = jwt.encode(
        {
            "sub": str(uuid4()),
            "sid": str(uuid4()),
            "typ": "access",
            "jti": str(uuid4()),
            "iss": settings.jwt_issuer,
            "aud": settings.jwt_audience,
            "iat": now - timedelta(minutes=10),
            "nbf": now - timedelta(minutes=10),
            "exp": now - timedelta(minutes=5),
        },
        settings.session_secret.get_secret_value(),
        algorithm="HS256",
    )

    with pytest.raises(ApplicationError) as caught:
        security.decode_access_token(token)
    assert caught.value.code == "INVALID_ACCESS_TOKEN"


def test_opaque_tokens_are_random_and_only_hashes_are_stable(security: AuthSecurity) -> None:
    first = security.new_opaque_token()
    second = security.new_opaque_token()

    assert first != second
    assert security.token_hash(first) == security.token_hash(first)
    assert security.token_hash(first) != security.token_hash(second)


@pytest.mark.parametrize(
    "password",
    ["short", "all-lowercase-2026", "ALL-UPPERCASE-2026", "NoDigitsAllowed"],
)
def test_weak_passwords_are_rejected(password: str) -> None:
    with pytest.raises(ApplicationError) as caught:
        validate_password_strength(password)
    assert caught.value.code == "VALIDATION_ERROR"


def test_strong_password_is_accepted() -> None:
    validate_password_strength("Jahan-Academy-2026")
