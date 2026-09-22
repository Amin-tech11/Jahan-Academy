from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status

from app.core.config import Settings, get_settings
from app.modules.identity.dependencies import (
    CurrentUser,
    auth_service,
    csrf_protection,
    current_user,
)
from app.modules.identity.schemas import (
    Acknowledgement,
    AcknowledgementEnvelope,
    EmailRequest,
    EmailVerificationRequest,
    LoginRequest,
    PasswordResetConfirmRequest,
    RegisterRequest,
    RegistrationEnvelope,
    RegistrationPending,
    TokenEnvelope,
    UserEnvelope,
)
from app.modules.identity.service import AuthService, IssuedTokens
from app.shared.exceptions import ApplicationError

router = APIRouter()
auth_router = APIRouter(prefix="/auth", tags=["identity"])
users_router = APIRouter(prefix="/users", tags=["identity"])


@auth_router.post(
    "/register",
    response_model=RegistrationEnvelope,
    status_code=status.HTTP_202_ACCEPTED,
)
async def register(
    payload: RegisterRequest,
    service: Annotated[AuthService, Depends(auth_service)],
) -> RegistrationEnvelope:
    await service.register(payload)
    return RegistrationEnvelope(
        data=RegistrationPending(email=payload.email, verification_required=True)
    )


@auth_router.post(
    "/email-verification-requests",
    response_model=AcknowledgementEnvelope,
    status_code=status.HTTP_202_ACCEPTED,
)
async def resend_email_verification(
    payload: EmailRequest,
    service: Annotated[AuthService, Depends(auth_service)],
) -> AcknowledgementEnvelope:
    await service.resend_email_verification(str(payload.email))
    return AcknowledgementEnvelope(data=Acknowledgement())


@auth_router.post("/email-verifications", response_model=TokenEnvelope)
async def verify_email(
    payload: EmailVerificationRequest,
    request: Request,
    response: Response,
    service: Annotated[AuthService, Depends(auth_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> TokenEnvelope:
    issued = await service.verify_email(
        payload.token,
        _client_ip(request),
        request.headers.get("user-agent"),
    )
    _set_auth_cookies(response, issued, settings)
    return TokenEnvelope(data=issued.view)


@auth_router.post("/login", response_model=TokenEnvelope)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    service: Annotated[AuthService, Depends(auth_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> TokenEnvelope:
    issued = await service.login(
        payload,
        _client_ip(request),
        request.headers.get("user-agent"),
    )
    _set_auth_cookies(response, issued, settings)
    return TokenEnvelope(data=issued.view)


@auth_router.post(
    "/refresh",
    response_model=TokenEnvelope,
    dependencies=[Depends(csrf_protection)],
)
async def refresh(
    request: Request,
    response: Response,
    service: Annotated[AuthService, Depends(auth_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> TokenEnvelope:
    refresh_token = request.cookies.get(settings.refresh_cookie_name)
    if not refresh_token:
        raise ApplicationError(
            code="INVALID_REFRESH_TOKEN",
            message="The refresh token is missing or invalid.",
            status_code=401,
        )
    issued = await service.refresh(
        refresh_token,
        _client_ip(request),
        request.headers.get("user-agent"),
    )
    _set_auth_cookies(response, issued, settings)
    return TokenEnvelope(data=issued.view)


@auth_router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(csrf_protection)],
)
async def logout(
    response: Response,
    principal: Annotated[CurrentUser, Depends(current_user)],
    service: Annotated[AuthService, Depends(auth_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> None:
    await service.logout(principal.claims)
    _clear_auth_cookies(response, settings)


@auth_router.post(
    "/password-reset-requests",
    response_model=AcknowledgementEnvelope,
    status_code=status.HTTP_202_ACCEPTED,
)
async def request_password_reset(
    payload: EmailRequest,
    service: Annotated[AuthService, Depends(auth_service)],
) -> AcknowledgementEnvelope:
    await service.request_password_reset(str(payload.email))
    return AcknowledgementEnvelope(data=Acknowledgement())


@auth_router.post("/password-resets", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(
    payload: PasswordResetConfirmRequest,
    service: Annotated[AuthService, Depends(auth_service)],
) -> None:
    await service.reset_password(payload)


@users_router.get("/me", response_model=UserEnvelope)
async def get_me(
    principal: Annotated[CurrentUser, Depends(current_user)],
) -> UserEnvelope:
    return UserEnvelope(data=principal.user)


def _set_auth_cookies(response: Response, issued: IssuedTokens, settings: Settings) -> None:
    max_age = settings.refresh_token_days * 24 * 60 * 60
    response.set_cookie(
        settings.refresh_cookie_name,
        issued.refresh_token,
        max_age=max_age,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/api/v1/auth",
    )
    response.set_cookie(
        settings.csrf_cookie_name,
        issued.view.csrf_token,
        max_age=max_age,
        httponly=False,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/api/v1/auth",
    )


def _clear_auth_cookies(response: Response, settings: Settings) -> None:
    response.delete_cookie(settings.refresh_cookie_name, path="/api/v1/auth")
    response.delete_cookie(settings.csrf_cookie_name, path="/api/v1/auth")


def _client_ip(request: Request) -> str | None:
    # Proxy headers are intentionally ignored until trusted-proxy middleware is configured.
    return request.client.host if request.client else None


router.include_router(auth_router)
router.include_router(users_router)
