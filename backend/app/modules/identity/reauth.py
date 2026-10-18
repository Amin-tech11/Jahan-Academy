"""One-use, session- and operation-bound step-up proofs."""

import hashlib
import secrets
from collections.abc import Awaitable
from typing import cast

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.modules.identity.security import AccessClaims
from app.shared.exceptions import ApplicationError

TTL = 300
CONSUME = """
if redis.call('GET', KEYS[1]) == ARGV[1] then
  redis.call('DEL', KEYS[1]); return 1
end
return 0
"""


def binding(claims: AccessClaims, method: str, path: str) -> str:
    return f"{claims.user_id}:{claims.session_id}:{method}:{path}"


def key(token: str) -> str:
    return "auth:reauth:" + hashlib.sha256(token.encode()).hexdigest()


def required() -> ApplicationError:
    return ApplicationError("REAUTH_REQUIRED", "Confirm your password and MFA again.", 403)


async def issue(redis: Redis, claims: AccessClaims, method: str, path: str) -> str:
    token = secrets.token_urlsafe(48)
    try:
        await redis.set(key(token), binding(claims, method, path), ex=TTL)
    except RedisError as error:
        raise ApplicationError("REAUTH_UNAVAILABLE", "Please try again shortly.", 503) from error
    return token


async def consume(
    redis: Redis,
    claims: AccessClaims,
    method: str,
    path: str,
    token: str | None,
) -> None:
    if not token or len(token) > 128:
        raise required()
    try:
        result = await cast(
            Awaitable[int],
            redis.eval(
                CONSUME,
                1,
                key(token),
                binding(claims, method, path),
            ),
        )
    except RedisError as error:
        raise ApplicationError("REAUTH_UNAVAILABLE", "Please try again shortly.", 503) from error
    if result != 1:
        raise required()
