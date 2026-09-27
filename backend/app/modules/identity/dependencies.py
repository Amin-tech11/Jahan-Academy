from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from functools import lru_cache
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import database_session
from app.core.config import Settings, get_settings
from app.modules.identity.authorization import (
    AuthorizationContext,
    AuthorizationRepository,
    AuthorizationService,
    PermissionMode,
    validate_permission_codes,
)
from app.modules.identity.mailer import SmtpAuthMailer
from app.modules.identity.repository import AuthRepository
from app.modules.identity.schemas import UserView
from app.modules.identity.security import AccessClaims, AuthSecurity
from app.modules.identity.service import AuthService
from app.modules.identity.staff_repository import StaffRepository
from app.modules.identity.staff_service import StaffManagementService
from app.shared.exceptions import ApplicationError

bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True, slots=True)
class CurrentUser:
    claims: AccessClaims
    user: UserView


@lru_cache
def auth_security() -> AuthSecurity:
    return AuthSecurity(get_settings())


def auth_service(
    session: Annotated[AsyncSession, Depends(database_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthService:
    return AuthService(
        repository=AuthRepository(session),
        security=auth_security(),
        mailer=SmtpAuthMailer(settings),
        settings=settings,
    )


def staff_management_service(
    session: Annotated[AsyncSession, Depends(database_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> StaffManagementService:
    return StaffManagementService(
        repository=StaffRepository(session),
        security=auth_security(),
        mailer=SmtpAuthMailer(settings),
        settings=settings,
    )


async def current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    service: Annotated[AuthService, Depends(auth_service)],
) -> CurrentUser:
    if credentials is None or credentials.scheme.casefold() != "bearer":
        raise ApplicationError(
            code="AUTHENTICATION_REQUIRED",
            message="Authentication is required.",
            status_code=401,
        )
    claims, user = await service.authenticate(credentials.credentials)
    return CurrentUser(claims=claims, user=user)


def csrf_protection(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
) -> None:
    csrf_header = request.headers.get("x-csrf-token")
    csrf_cookie = request.cookies.get(settings.csrf_cookie_name)
    if (
        not csrf_header
        or not csrf_cookie
        or not AuthSecurity.constant_time_equal(csrf_header, csrf_cookie)
    ):
        raise ApplicationError(
            code="CSRF_FAILED",
            message="The CSRF token is missing or invalid.",
            status_code=403,
        )


async def authorization_context(
    principal: Annotated[CurrentUser, Depends(current_user)],
    session: Annotated[AsyncSession, Depends(database_session)],
) -> AuthorizationContext:
    service = AuthorizationService(AuthorizationRepository(session))
    return await service.context_for(principal.user.id)


def require_permissions(
    *permission_codes: str,
    mode: PermissionMode = PermissionMode.ALL,
) -> Callable[..., Awaitable[AuthorizationContext]]:
    required = frozenset(permission_codes)
    validate_permission_codes(required)

    async def dependency(
        context: Annotated[AuthorizationContext, Depends(authorization_context)],
    ) -> AuthorizationContext:
        AuthorizationService.require(context, required, mode=mode)
        return context

    return dependency
