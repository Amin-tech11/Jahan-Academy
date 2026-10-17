"""Shared, atomic authentication limits; Redis keys never contain identifiers."""

from __future__ import annotations

import hmac
from collections.abc import Awaitable
from typing import cast
from uuid import UUID

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import Settings
from app.shared.exceptions import ApplicationError

LIMIT_SCRIPT = """
local count = redis.call('INCR', KEYS[1])
if count == 1 or redis.call('TTL', KEYS[1]) < 0 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
if count > tonumber(ARGV[2]) then return math.max(1, redis.call('TTL', KEYS[1])) end
return 0
"""

FAILURE_SCRIPT = """
local count = redis.call('INCR', KEYS[1])
if count == 1 or redis.call('TTL', KEYS[1]) < 0 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local delay = 0
if count >= tonumber(ARGV[2]) then
  redis.call('DEL', KEYS[1])
  local locks = redis.call('INCR', KEYS[2])
  redis.call('EXPIRE', KEYS[2], 86400)
  delay = math.min(86400, tonumber(ARGV[3]) * 2 ^ math.min(locks - 1, 16))
end
return {count, delay}
"""


class AuthAbuseControl:
    def __init__(self, redis: Redis, settings: Settings) -> None:
        self._redis = redis
        self._settings = settings

    def _key(self, scope: str, subject: str) -> str:
        digest = hmac.digest(
            self._settings.session_secret.get_secret_value().encode(),
            f"{scope}\0{subject}".encode(),
            "sha256",
        ).hex()
        return f"auth:{scope}:{digest}"

    @staticmethod
    def _unavailable() -> ApplicationError:
        return ApplicationError(
            "AUTH_LIMITER_UNAVAILABLE",
            "Please try again shortly.",
            503,
            headers={"Retry-After": "30", "Cache-Control": "no-store"},
        )

    async def _check(self, scope: str, subject: str, limit: int) -> None:
        try:
            retry = int(
                await cast(
                    Awaitable[int],
                    self._redis.eval(
                        LIMIT_SCRIPT,
                        1,
                        self._key(scope, subject),
                        str(self._settings.auth_rate_window_seconds),
                        str(limit),
                    ),
                )
            )
        except RedisError as error:
            raise self._unavailable() from error
        if retry:
            raise ApplicationError(
                "AUTH_RATE_LIMITED",
                "Too many requests. Please try again later.",
                429,
                headers={"Retry-After": str(retry), "Cache-Control": "no-store"},
            )

    async def check_request(self, operation: str, ip: str, identifier: str) -> None:
        settings = self._settings
        ip_limit = (
            settings.auth_refresh_ip_limit
            if operation in {"refresh", "activity"}
            else settings.auth_ip_limit
        )
        limit = settings.auth_identifier_limit
        if operation in {"email", "register"}:
            limit = settings.auth_email_identifier_limit
        elif operation in {"refresh", "activity"}:
            limit = settings.auth_refresh_identifier_limit
        await self._check(f"{operation}:ip", ip, ip_limit)
        await self._check(f"{operation}:identifier", identifier, limit)

    async def check_account(self, operation: str, user_id: UUID) -> None:
        limit = (
            self._settings.auth_refresh_identifier_limit
            if operation == "refresh"
            else self._settings.auth_identifier_limit
        )
        await self._check(f"{operation}:account", str(user_id), limit)

    async def register_failure(self, user_id: UUID) -> tuple[int, int]:
        try:
            result = await cast(
                Awaitable[list[int]],
                self._redis.eval(
                    FAILURE_SCRIPT,
                    2,
                    self._key("failures", str(user_id)),
                    self._key("lockouts", str(user_id)),
                    str(self._settings.login_failure_window_seconds),
                    str(self._settings.login_max_attempts),
                    str(self._settings.login_lock_minutes * 60),
                ),
            )
        except RedisError as error:
            raise self._unavailable() from error
        return int(result[0]), int(result[1])

    async def clear_failures(self, user_id: UUID) -> None:
        try:
            await self._redis.delete(
                self._key("failures", str(user_id)), self._key("lockouts", str(user_id))
            )
        except RedisError as error:
            raise self._unavailable() from error
