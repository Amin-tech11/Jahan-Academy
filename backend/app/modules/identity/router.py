from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Request, Response, status

from app.core.config import Settings, get_settings
from app.modules.identity.authorization import AuthorizationContext
from app.modules.identity.dependencies import (
    CurrentUser,
    auth_service,
    authorization_context,
    csrf_protection,
    current_user,
    panel_access_service,
    require_permissions,
    staff_management_service,
)
from app.modules.identity.domain import StaffRoleCode
from app.modules.identity.panel_service import PanelAccessService
from app.modules.identity.schemas import (
    Acknowledgement,
    AcknowledgementEnvelope,
    EmailRequest,
    EmailVerificationRequest,
    LoginRequest,
    PanelAccessEnvelope,
    PanelAccessUpdate,
    PanelAccessView,
    PasswordResetConfirmRequest,
    RegisterRequest,
    RegistrationEnvelope,
    RegistrationPending,
    StaffAccessRecoveryRequest,
    StaffCreateRequest,
    StaffEnvelope,
    StaffPage,
    StaffRolesUpdateRequest,
    StaffUpdateRequest,
    TokenEnvelope,
    UserEnvelope,
)
from app.modules.identity.service import AuthService, IssuedTokens
from app.modules.identity.staff_service import StaffManagementService
from app.shared.exceptions import ApplicationError

router = APIRouter()
auth_router = APIRouter(prefix="/auth", tags=["identity"])
users_router = APIRouter(prefix="/users", tags=["identity"])
staff_router = APIRouter(prefix="/admin/staff", tags=["staff-administration"])


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


@staff_router.post(
    "",
    response_model=StaffEnvelope,
    status_code=status.HTTP_201_CREATED,
)
async def create_staff(
    payload: StaffCreateRequest,
    response: Response,
    actor: Annotated[AuthorizationContext, Depends(require_permissions("identity.manage"))],
    service: Annotated[StaffManagementService, Depends(staff_management_service)],
) -> StaffEnvelope:
    staff = await service.create(actor, payload)
    response.headers["ETag"] = _etag(staff.version)
    return StaffEnvelope(data=staff)


@staff_router.get("", response_model=StaffPage)
async def list_staff(
    actor: Annotated[AuthorizationContext, Depends(require_permissions("identity.manage"))],
    service: Annotated[StaffManagementService, Depends(staff_management_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    q: Annotated[str | None, Query(min_length=1, max_length=200)] = None,
    account_status: Annotated[
        str | None, Query(alias="status", pattern="^(active|disabled|locked)$")
    ] = None,
    role: StaffRoleCode | None = None,
) -> StaffPage:
    return await service.list(
        actor,
        page=page,
        page_size=limit,
        query=q,
        account_status=account_status,
        role_code=role,
    )


@staff_router.get("/{staff_id}", response_model=StaffEnvelope)
async def get_staff(
    staff_id: UUID,
    response: Response,
    actor: Annotated[AuthorizationContext, Depends(require_permissions("identity.manage"))],
    service: Annotated[StaffManagementService, Depends(staff_management_service)],
) -> StaffEnvelope:
    staff = await service.get(actor, staff_id)
    response.headers["ETag"] = _etag(staff.version)
    return StaffEnvelope(data=staff)


@staff_router.patch("/{staff_id}", response_model=StaffEnvelope)
async def update_staff(
    staff_id: UUID,
    payload: StaffUpdateRequest,
    response: Response,
    actor: Annotated[AuthorizationContext, Depends(require_permissions("identity.manage"))],
    service: Annotated[StaffManagementService, Depends(staff_management_service)],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
) -> StaffEnvelope:
    staff = await service.update(
        actor, staff_id, payload, expected_version=_parse_if_match(if_match)
    )
    response.headers["ETag"] = _etag(staff.version)
    return StaffEnvelope(data=staff)


@staff_router.put("/{staff_id}/roles", response_model=StaffEnvelope)
async def replace_staff_roles(
    staff_id: UUID,
    payload: StaffRolesUpdateRequest,
    response: Response,
    actor: Annotated[AuthorizationContext, Depends(require_permissions("role.manage"))],
    service: Annotated[StaffManagementService, Depends(staff_management_service)],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
) -> StaffEnvelope:
    staff = await service.replace_roles(
        actor, staff_id, payload, expected_version=_parse_if_match(if_match)
    )
    response.headers["ETag"] = _etag(staff.version)
    return StaffEnvelope(data=staff)


@staff_router.post(
    "/{staff_id}/access-recovery",
    response_model=StaffEnvelope,
    status_code=status.HTTP_202_ACCEPTED,
)
async def recover_staff_access(
    staff_id: UUID,
    payload: StaffAccessRecoveryRequest,
    response: Response,
    actor: Annotated[AuthorizationContext, Depends(require_permissions("identity.manage"))],
    service: Annotated[StaffManagementService, Depends(staff_management_service)],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
) -> StaffEnvelope:
    staff = await service.recover_access(
        actor, staff_id, payload, expected_version=_parse_if_match(if_match)
    )
    response.headers["ETag"] = _etag(staff.version)
    return StaffEnvelope(data=staff)


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


def _etag(version: int) -> str:
    return f'"{version}"'


def _parse_if_match(value: str | None) -> int:
    if value is None:
        raise ApplicationError(
            code="PRECONDITION_REQUIRED",
            message="If-Match is required for this operation.",
            status_code=428,
        )
    normalized = value.strip()
    if normalized.startswith("W/"):
        normalized = normalized[2:]
    normalized = normalized.strip('"')
    if not normalized.isdigit() or int(normalized) < 1:
        raise ApplicationError(
            code="INVALID_IF_MATCH",
            message="If-Match must contain a valid staff version.",
            status_code=400,
        )
    return int(normalized)


@users_router.get("/me/panel-access", response_model=PanelAccessEnvelope)
async def own_panel_access(
    actor: Annotated[AuthorizationContext, Depends(authorization_context)],
) -> PanelAccessEnvelope:
    return PanelAccessEnvelope(
        data=PanelAccessView(
            sections=sorted(actor.panel_sections or ()),
            is_super_admin=actor.is_super_admin,
        )
    )


@staff_router.get("/{staff_id}/panel-access", response_model=PanelAccessEnvelope)
async def get_staff_panel_access(
    staff_id: UUID,
    actor: Annotated[AuthorizationContext, Depends(require_permissions("role.manage"))],
    service: Annotated[PanelAccessService, Depends(panel_access_service)],
) -> PanelAccessEnvelope:
    return PanelAccessEnvelope(data=await service.get(actor, staff_id))


@staff_router.put("/{staff_id}/panel-access", response_model=PanelAccessEnvelope)
async def replace_staff_panel_access(
    staff_id: UUID,
    payload: PanelAccessUpdate,
    response: Response,
    actor: Annotated[AuthorizationContext, Depends(require_permissions("role.manage"))],
    service: Annotated[PanelAccessService, Depends(panel_access_service)],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
) -> PanelAccessEnvelope:
    view = await service.replace(
        actor,
        staff_id,
        payload.sections,
        _parse_if_match(if_match),
    )
    response.headers["ETag"] = _etag(view.version or 1)
    return PanelAccessEnvelope(data=view)


router.include_router(auth_router)
router.include_router(users_router)
router.include_router(staff_router)
