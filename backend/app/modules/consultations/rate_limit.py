from __future__ import annotations

import logging

from redis.asyncio import Redis
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)


class ConsultationRateLimiter:
    def __init__(self, redis: Redis, *, limit: int, window_seconds: int) -> None:
        self._redis = redis
        self._limit = limit
        self.window_seconds = window_seconds

    async def allow(self, subject_hash: str) -> bool:
        key = f"consultation:rate:{subject_hash}"
        try:
            count = await self._redis.incr(key)
            if count == 1:
                await self._redis.expire(key, self.window_seconds)
            return bool(count <= self._limit)
        except RedisError:
            logger.warning(
                "Consultation rate limiter is unavailable; request allowed", exc_info=True
            )
            return True
