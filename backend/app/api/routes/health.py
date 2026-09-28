from fastapi import APIRouter, Header, HTTPException, Response, status
from fastapi.responses import PlainTextResponse
from redis.asyncio import Redis
from sqlalchemy import text

from app.core.config import get_settings
from app.core.database import session_factory
from app.core.operational import monitoring_token_is_valid, render_metrics
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
        checks["database"] = False
    try:
        redis: Redis = get_redis()
        checks["redis"] = bool(await redis.ping())
    except Exception:
        checks["redis"] = False
    ready = all(checks.values())
    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {"status": "ok" if ready else "not_ready", "checks": checks}


@router.get("/internal/metrics", include_in_schema=False, response_class=PlainTextResponse)
async def internal_metrics(
    token: str | None = Header(default=None, alias="X-Monitoring-Token"),
) -> PlainTextResponse:
    if not monitoring_token_is_valid(token, get_settings()):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return PlainTextResponse(render_metrics(), media_type="text/plain; version=0.0.4")
