from __future__ import annotations

from functools import lru_cache
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import database_session
from app.core.config import Settings, get_settings
from app.modules.identity.authorization import AuthorizationContext
from app.modules.identity.dependencies import require_permissions
from app.modules.media.domain import MediaPurpose, UploadStatus
from app.modules.media.repository import MediaRepository
from app.modules.media.schemas import (
    ConfirmUploadRequest,
    MediaAssetEnvelope,
    MediaMetadataUpdate,
    MediaPage,
    UploadIntentEnvelope,
    UploadIntentRequest,
)
from app.modules.media.service import MediaService
from app.modules.media.storage import MediaStorage, S3MediaStorage
from app.modules.media.validation import (
    ClamAvScanner,
    DisabledMalwareScanner,
    MalwareScanner,
    MediaContentValidator,
)
from app.shared.exceptions import ApplicationError

router = APIRouter(tags=["media"])


@lru_cache
def media_storage() -> S3MediaStorage:
    return S3MediaStorage(get_settings())


def malware_scanner(
    settings: Annotated[Settings, Depends(get_settings)],
) -> MalwareScanner:
    if settings.malware_scan_enabled:
        return ClamAvScanner(
            settings.clamav_host, settings.clamav_port, settings.clamav_timeout_seconds
        )
    return DisabledMalwareScanner()


def media_service(
    session: Annotated[AsyncSession, Depends(database_session)],
    settings: Annotated[Settings, Depends(get_settings)],
    storage: Annotated[MediaStorage, Depends(media_storage)],
    scanner: Annotated[MalwareScanner, Depends(malware_scanner)],
) -> MediaService:
    return MediaService(
        MediaRepository(session),
        storage,
        MediaContentValidator(settings.media_max_image_pixels),
        scanner,
        settings,
    )


@router.post(
    "/admin/media/upload-intents",
    response_model=UploadIntentEnvelope,
    status_code=status.HTTP_201_CREATED,
    summary="Create a validated direct-upload intent",
)
async def create_upload_intent(
    payload: UploadIntentRequest,
    service: Annotated[MediaService, Depends(media_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("media.write"))],
) -> UploadIntentEnvelope:
    intent = await service.create_upload_intent(payload.model_dump(mode="python"), actor)
    return UploadIntentEnvelope(data=intent)


@router.post(
    "/admin/media/{asset_id}/confirm",
    response_model=MediaAssetEnvelope,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Confirm, inspect, scan, and publish an uploaded media asset",
)
async def confirm_upload(
    asset_id: UUID,
    payload: ConfirmUploadRequest,
    response: Response,
    service: Annotated[MediaService, Depends(media_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("media.write"))],
) -> MediaAssetEnvelope:
    asset = await service.confirm(asset_id, payload.checksum_sha256, actor)
    response.headers["ETag"] = _etag(asset.version)
    return MediaAssetEnvelope(data=asset)


@router.get(
    "/admin/media",
    response_model=MediaPage,
    summary="List and search media assets",
)
async def list_media(
    service: Annotated[MediaService, Depends(media_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("media.read"))],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    q: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    purpose: MediaPurpose | None = None,
    upload_status: UploadStatus | None = None,
    mime_type: Annotated[str | None, Query(min_length=3, max_length=150)] = None,
) -> MediaPage:
    return await service.list(
        page=page,
        limit=limit,
        query=q,
        purpose=purpose,
        upload_status=upload_status,
        mime_type=mime_type,
    )


@router.get(
    "/admin/media/{asset_id}",
    response_model=MediaAssetEnvelope,
    summary="Get one media asset",
)
async def get_media(
    asset_id: UUID,
    response: Response,
    service: Annotated[MediaService, Depends(media_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("media.read"))],
) -> MediaAssetEnvelope:
    asset = await service.get(asset_id)
    response.headers["ETag"] = _etag(asset.version)
    return MediaAssetEnvelope(data=asset)


@router.patch(
    "/admin/media/{asset_id}",
    response_model=MediaAssetEnvelope,
    summary="Update media accessibility and attribution metadata",
)
async def update_media(
    asset_id: UUID,
    payload: MediaMetadataUpdate,
    response: Response,
    service: Annotated[MediaService, Depends(media_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("media.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
) -> MediaAssetEnvelope:
    asset = await service.update_metadata(
        asset_id,
        payload.model_dump(mode="python", exclude_unset=True),
        _parse_if_match(if_match),
        actor,
    )
    response.headers["ETag"] = _etag(asset.version)
    return MediaAssetEnvelope(data=asset)


@router.delete(
    "/admin/media/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an unused media asset",
)
async def delete_media(
    asset_id: UUID,
    service: Annotated[MediaService, Depends(media_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("media.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
) -> Response:
    await service.delete(asset_id, _parse_if_match(if_match), actor)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/media/{asset_id}/content",
    response_class=RedirectResponse,
    include_in_schema=True,
    summary="Resolve a ready public media asset",
)
async def public_media_content(
    asset_id: UUID,
    service: Annotated[MediaService, Depends(media_service)],
) -> RedirectResponse:
    url = await service.public_download_url(asset_id)
    return RedirectResponse(
        url=url,
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        headers={"Cache-Control": "public, max-age=60, stale-while-revalidate=300"},
    )


def _etag(version: int) -> str:
    return f'"{version}"'


def _parse_if_match(value: str | None) -> int:
    if value is None:
        raise ApplicationError(
            "PRECONDITION_REQUIRED", "If-Match is required for this operation.", 428
        )
    normalized = value.strip().removeprefix("W/").strip('"')
    if not normalized.isdigit() or int(normalized) < 1:
        raise ApplicationError("INVALID_IF_MATCH", "If-Match must contain a valid version.", 400)
    return int(normalized)
