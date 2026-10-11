from __future__ import annotations

import logging

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.rate_limit import window_count
from app.shared.exceptions import ApplicationError

logger = logging.getLogger(__name__)


class ConsultationRateLimiter:
    def __init__(self, redis: Redis, *, limit: int, window_seconds: int) -> None:
        self._redis = redis
        self._limit = limit
        self.window_seconds = window_seconds

    async def allow(self, subject_hash: str) -> bool:
        key = f"consultation:rate:{subject_hash}"
        try:
            count = await window_count(self._redis, key, self.window_seconds)
            return bool(count <= self._limit)
        except RedisError:
            raise ApplicationError(
                code="RATE_LIMITER_UNAVAILABLE",
                message="Please try again shortly.",
                status_code=503,
            ) from None
