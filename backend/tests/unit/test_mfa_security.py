import base64

import pytest
from cryptography.fernet import InvalidToken
from pydantic import SecretStr, ValidationError

from app.core.config import Settings
from app.modules.identity.mfa import MfaSecurity


def test_rfc6238_sha1_vectors_clock_drift_and_replay() -> None:
    security = MfaSecurity(Settings())
    secret = base64.b32encode(b"12345678901234567890").decode()
    for timestamp, expected in [(59, "287082"), (1111111109, "081804"), (20000000000, "353130")]:
        counter = timestamp // 30
        assert security.code(secret, counter) == expected
        assert security.verify(secret, expected, -1, timestamp) == counter
        assert security.verify(secret, expected, counter, timestamp) is None
    assert security.verify(secret, "１２３４５６", -1, 59) is None
    assert security.verify(secret, "bad", -1, 59) is None
    assert security.verify(secret, security.code(secret, 3), -1, 59) is None


def test_mfa_seeds_are_encrypted_and_key_validation_is_explicit() -> None:
    settings = Settings(mfa_encryption_key=SecretStr(base64.urlsafe_b64encode(b"a" * 32).decode()))
    security = MfaSecurity(settings)
    secret = security.new_secret()
    encrypted = security.encrypt(secret)
    assert secret not in encrypted
    assert security.decrypt(encrypted) == secret
    with pytest.raises(InvalidToken):
        MfaSecurity(Settings()).decrypt(encrypted)
    with pytest.raises(ValidationError):
        Settings(mfa_encryption_key=SecretStr("invalid"))
