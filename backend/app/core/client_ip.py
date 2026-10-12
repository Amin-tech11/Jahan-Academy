from __future__ import annotations

import hmac
from ipaddress import ip_address

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

from app.core.config import Settings


class TrustedClientIPMiddleware(BaseHTTPMiddleware):
    """Only the isolated reverse proxy can assert an end-user IP, including BFF requests."""

    def __init__(self, app: ASGIApp, settings: Settings) -> None:
        super().__init__(app)
        self._secret = settings.trusted_proxy_secret

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        supplied = request.headers.get("x-jahan-proxy-key", "")
        if self._secret and hmac.compare_digest(
            supplied.encode("utf-8"), self._secret.get_secret_value().encode("utf-8")
        ):
            try:
                address = str(ip_address(request.headers.get("x-jahan-client-ip", "")))
            except ValueError:
                pass
            else:
                request.scope["client"] = (address, 0)
        # Do not pass the infrastructure credential to routers/loggers.
        request.scope["headers"] = [
            (name, value)
            for name, value in request.scope["headers"]
            if name != b"x-jahan-proxy-key"
        ]
        return await call_next(request)
