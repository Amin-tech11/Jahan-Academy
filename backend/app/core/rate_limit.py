from __future__ import annotations

from collections.abc import Awaitable
from typing import cast

from redis.asyncio import Redis

# One Redis operation: an interrupted INCR/EXPIRE pair must not leave an immortal key.
WINDOW_SCRIPT = """
local count = redis.call('INCR', KEYS[1])
if count == 1 or redis.call('TTL', KEYS[1]) < 0 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
"""


async def window_count(redis: Redis, key: str, seconds: int) -> int:
    return int(await cast(Awaitable[int | str], redis.eval(WINDOW_SCRIPT, 1, key, str(seconds))))
