from __future__ import annotations

import hashlib
import io
import os
from uuid import UUID, uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.modules.identity.authorization import AuthorizationContext, RoleGrant
from app.modules.identity.dependencies import authorization_context
from app.modules.media.router import malware_scanner, media_storage
from app.modules.media.storage import StoredObject
from app.modules.media.validation import DisabledMalwareScanner

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1",
    reason="requires migrated PostgreSQL",
)


class FakeStorage:
    def __init__(self) -> None:
        self.objects: dict[tuple[str, str], tuple[bytes, str]] = {}
        self.pending: tuple[str, str, str] | None = None

    async def create_upload_url(
        self, bucket: str, object_key: str, content_type: str, expires_seconds: int
    ) -> str:
        del expires_seconds
        self.pending = bucket, object_key, content_type
        return f"https://storage.test/{bucket}/{object_key}"

    def upload_pending(self, content: bytes) -> None:
        assert self.pending is not None
        bucket, key, mime_type = self.pending
        self.objects[(bucket, key)] = content, mime_type

    async def head(self, bucket: str, object_key: str) -> StoredObject:
        content, mime_type = self.objects[(bucket, object_key)]
        return StoredObject(size_bytes=len(content), content_type=mime_type)

    async def read(self, bucket: str, object_key: str, max_bytes: int) -> bytes:
        content = self.objects[(bucket, object_key)][0]
        assert len(content) <= max_bytes
        return content

    async def promote(
        self, source_bucket: str, source_key: str, target_bucket: str, target_key: str
    ) -> None:
        self.objects[(target_bucket, target_key)] = self.objects.pop((source_bucket, source_key))

    async def delete(self, bucket: str, object_key: str) -> None:
        self.objects.pop((bucket, object_key), None)

    async def create_download_url(self, bucket: str, object_key: str, expires_seconds: int) -> str:
        del expires_seconds
        assert (bucket, object_key) in self.objects
        return f"https://cdn.test/{bucket}/{object_key}"


def _sync_database_url() -> str:
    return os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")


def _create_actor() -> UUID:
    actor_id = uuid4()
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO users (id, status, preferred_locale) VALUES (%s, 'active', 'fa')",
            (actor_id,),
        )
    return actor_id


def _cleanup(actor_id: UUID, asset_ids: list[UUID]) -> None:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        if asset_ids:
            cursor.execute("DELETE FROM audit_logs WHERE entity_id = ANY(%s)", (asset_ids,))
            cursor.execute("DELETE FROM media_assets WHERE id = ANY(%s)", (asset_ids,))
        cursor.execute("DELETE FROM users WHERE id = %s", (actor_id,))


def _png() -> bytes:
    output = io.BytesIO()
    Image.new("RGB", (120, 80), color=(20, 55, 90)).save(output, format="PNG")
    return output.getvalue()


def test_media_upload_management_and_public_delivery() -> None:
    actor_id = _create_actor()
    actor = AuthorizationContext(
        user_id=actor_id,
        grants=(
            RoleGrant(
                role="content_editor",
                scope_type="global",
                scope_id=None,
                permissions=frozenset({"media.read", "media.write"}),
            ),
        ),
    )
    storage = FakeStorage()
    asset_ids: list[UUID] = []

    async def actor_override() -> AuthorizationContext:
        return actor

    def storage_override() -> FakeStorage:
        return storage

    def scanner_override() -> DisabledMalwareScanner:
        return DisabledMalwareScanner()

    app.dependency_overrides[authorization_context] = actor_override
    app.dependency_overrides[media_storage] = storage_override
    app.dependency_overrides[malware_scanner] = scanner_override
    content = _png()
    payload = {
        "filename": "campus.png",
        "mimeType": "image/png",
        "sizeBytes": len(content),
        "purpose": "university_image",
        "altFa": "نمای پردیس دانشگاه",
        "altEn": "University campus view",
    }

    try:
        with TestClient(app, follow_redirects=False) as client:
            created = client.post("/api/v1/admin/media/upload-intents", json=payload)
            assert created.status_code == 201, created.text
            asset_id = UUID(created.json()["data"]["id"])
            asset_ids.append(asset_id)
            assert created.json()["data"]["headers"] == {"Content-Type": "image/png"}

            storage.upload_pending(content)
            confirmed = client.post(
                f"/api/v1/admin/media/{asset_id}/confirm",
                json={"checksumSha256": hashlib.sha256(content).hexdigest()},
            )
            assert confirmed.status_code == 202, confirmed.text
            assert confirmed.json()["data"]["uploadStatus"] == "ready"
            assert confirmed.json()["data"]["scanStatus"] == "clean"
            assert confirmed.json()["data"]["width"] == 120
            etag = confirmed.headers["etag"]

            listing = client.get(
                "/api/v1/admin/media", params={"purpose": "university_image", "q": "campus"}
            )
            assert listing.status_code == 200
            assert listing.json()["meta"]["total"] == 1

            updated = client.patch(
                f"/api/v1/admin/media/{asset_id}",
                headers={"If-Match": etag},
                json={
                    "attribution": "Jahan Academy",
                },
            )
            assert updated.status_code == 200, updated.text
            assert updated.json()["data"]["attribution"] == "Jahan Academy"
            assert updated.json()["data"]["altFa"] == "نمای پردیس دانشگاه"

            stale_delete = client.delete(
                f"/api/v1/admin/media/{asset_id}", headers={"If-Match": etag}
            )
            assert stale_delete.status_code == 412

            public = client.get(f"/api/v1/media/{asset_id}/content")
            assert public.status_code == 307
            assert public.headers["location"].startswith("https://cdn.test/")

            deleted = client.delete(
                f"/api/v1/admin/media/{asset_id}",
                headers={"If-Match": updated.headers["etag"]},
            )
            assert deleted.status_code == 204
            assert client.get(f"/api/v1/media/{asset_id}/content").status_code == 404
    finally:
        app.dependency_overrides.clear()
        _cleanup(actor_id, asset_ids)
