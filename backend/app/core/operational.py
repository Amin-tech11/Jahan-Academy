from __future__ import annotations

import asyncio
import hmac
import logging
import time
from collections import Counter
from uuid import uuid4

import structlog
from fastapi import Request
from fastapi.responses import JSONResponse, Response
from redis.exceptions import RedisError
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

from app.core.config import Settings
from app.core.redis import get_redis

logger = logging.getLogger(__name__)
metrics = Counter[str]()
metrics_lock = asyncio.Lock()


async def increment_metric(name: str) -> None:
    async with metrics_lock:
        metrics[name] += 1


def render_metrics() -> str:
    lines = ["# TYPE jahan_http_requests_total counter"]
    for name, count in sorted(metrics.items()):
        lines.append(f"jahan_{name} {count}")
    return "\n".join(lines) + "\n"


def monitoring_token_is_valid(value: str | None, settings: Settings) -> bool:
    expected = settings.monitoring_token
    return bool(value and expected and hmac.compare_digest(value, expected.get_secret_value()))


class OperationalMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, settings: Settings) -> None:
        super().__init__(app)
        self._settings = settings

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("x-request-id", "")
        if len(request_id) > 100 or not request_id.isascii():
            request_id = ""
        request_id = request_id or str(uuid4())
        structlog.contextvars.bind_contextvars(request_id=request_id)
        started = time.perf_counter()
        try:
            limited = await self._is_limited(request)
            if limited:
                await increment_metric("rate_limited_total")
                response: Response = JSONResponse(
                    status_code=429,
                    content={
                        "error": {
                            "code": "RATE_LIMITED",
                            "message": "Too many requests. Please try again later.",
                            "fieldErrors": {},
                            "requestId": request_id,
                        }
                    },
                    headers={"Retry-After": str(self._settings.api_rate_window_seconds)},
                )
            else:
                response = await call_next(request)
            self._apply_headers(response)
            response.headers["X-Request-ID"] = request_id
            await increment_metric(f"http_responses_{response.status_code}_total")
            structlog.get_logger(__name__).info(
                "http_request_completed",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=round((time.perf_counter() - started) * 1000, 2),
            )
            return response
        finally:
            structlog.contextvars.clear_contextvars()

    async def _is_limited(self, request: Request) -> bool:
        if not request.url.path.startswith("/api/") or request.method == "OPTIONS":
            return False
        client_host = request.client.host if request.client else "unknown"
        key = f"api:rate:{client_host}:{request.method}"
        try:
            redis = get_redis()
            count = await redis.incr(key)
            if count == 1:
                await redis.expire(key, self._settings.api_rate_window_seconds)
            return bool(count > self._settings.api_rate_limit)
        except RedisError:
            logger.warning("API rate limiter is unavailable; request allowed", exc_info=True)
            return False

    def _apply_headers(self, response: Response) -> None:
        headers = response.headers
        headers.setdefault("X-Content-Type-Options", "nosniff")
        headers.setdefault("X-Frame-Options", "DENY")
        headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        headers.setdefault(
            "Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
        )
        if self._settings.environment == "production":
            headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
