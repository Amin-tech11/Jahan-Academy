from __future__ import annotations

from typing import Any
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.shared.exceptions import ApplicationError


def _error_body(
    code: str,
    message: str,
    request_id: str,
    fields: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "fieldErrors": fields or {},
            "requestId": request_id,
        }
    }


def install_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApplicationError)
    async def handle_application_error(request: Request, exc: ApplicationError) -> JSONResponse:
        request_id = request.headers.get("x-request-id", str(uuid4()))
        content = _error_body(exc.code, exc.message, request_id, exc.field_errors)
        headers = dict(exc.headers)
        if exc.status_code == 401:
            headers["WWW-Authenticate"] = "Bearer"
        return JSONResponse(status_code=exc.status_code, content=content, headers=headers)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        request_id = request.headers.get("x-request-id", str(uuid4()))
        fields: dict[str, list[str]] = {}
        for error in exc.errors():
            location = [str(item) for item in error["loc"] if item not in {"body", "query", "path"}]
            field_name = ".".join(location) or "request"
            fields.setdefault(field_name, []).append(str(error["type"]).upper())
        content = _error_body(
            "VALIDATION_ERROR",
            "The request contains invalid fields.",
            request_id,
            fields,
        )
        return JSONResponse(status_code=422, content=content)
