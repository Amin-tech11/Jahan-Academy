from __future__ import annotations

import base64
import hmac
import secrets
import struct
import time
from urllib.parse import quote, urlencode

from cryptography.fernet import Fernet

from app.core.config import Settings
from app.shared.exceptions import ApplicationError


class MfaSecurity:
    """RFC 6238 TOTP with replay prevention handled under a database row lock."""

    def __init__(self, settings: Settings) -> None:
        if settings.mfa_encryption_key:
            self._cipher = Fernet(settings.mfa_encryption_key.get_secret_value().encode())
        elif settings.environment == "production":
            raise ApplicationError(
                code="MFA_UNAVAILABLE", message="MFA is not configured.", status_code=503
            )
        else:
            key = hmac.digest(
                settings.session_secret.get_secret_value().encode(), b"jahan-mfa-v1", "sha256"
            )
            self._cipher = Fernet(base64.urlsafe_b64encode(key))

    @staticmethod
    def new_secret() -> str:
        return base64.b32encode(secrets.token_bytes(20)).decode().rstrip("=")

    def encrypt(self, secret: str) -> str:
        return self._cipher.encrypt(secret.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        return self._cipher.decrypt(ciphertext.encode()).decode()

    @staticmethod
    def code(secret: str, counter: int) -> str:
        digest = hmac.digest(base64.b32decode(secret), struct.pack(">Q", counter), "sha1")
        offset = digest[-1] & 15
        value = struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF
        return f"{value % 1000000:06}"

    def verify(
        self, secret: str, code: str, last_counter: int, now: float | None = None
    ) -> int | None:
        if not code.isascii() or not code.isdigit() or len(code) != 6:
            return None
        counter = int((time.time() if now is None else now) / 30)
        for candidate in (counter, counter - 1, counter + 1):
            if candidate > last_counter and hmac.compare_digest(self.code(secret, candidate), code):
                return candidate
        return None

    @staticmethod
    def uri(secret: str, email: str) -> str:
        return (
            "otpauth://totp/"
            + quote("Jahan Academy:" + email, safe="")
            + "?"
            + urlencode(
                {
                    "secret": secret,
                    "issuer": "Jahan Academy",
                    "algorithm": "SHA1",
                    "digits": 6,
                    "period": 30,
                }
            )
        )
