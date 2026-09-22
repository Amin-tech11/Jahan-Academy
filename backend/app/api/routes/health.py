from fastapi import APIRouter, Response, status
from redis.asyncio import Redis
from sqlalchemy import text

from app.core.database import session_factory
from app.core.redis import get_redis

router = APIRouter(tags=["health"])


@router.get("/health/live", include_in_schema=False)
async def liveness() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/ready", include_in_schema=False)
async def readiness(response: Response) -> dict[str, object]:
    checks: dict[str, bool] = {"database": False, "redis": False}
    try:
        async with session_factory() as session:
            await session.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        pass
    try:
        redis: Redis = get_redis()
        checks["redis"] = bool(await redis.ping())
    except Exception:
        pass
    ready = all(checks.values())
    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {"status": "ok" if ready else "not_ready", "checks": checks}
