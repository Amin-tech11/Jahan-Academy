import asyncio
import hashlib
import io
import os
from uuid import UUID, uuid4

import boto3  # type: ignore[import-untyped]
import httpx
import pytest
from botocore.client import Config  # type: ignore[import-untyped]
from fastapi.testclient import TestClient
from pydantic import SecretStr
from pypdf import PdfWriter
from pypdf.generic import (
    ArrayObject,
    DecodedStreamObject,
    DictionaryObject,
    NameObject,
    TextStringObject,
)

from app.core.config import Settings
from app.main import app
from app.modules.identity.authorization import AuthorizationContext, RoleGrant
from app.modules.identity.dependencies import authorization_context
from app.modules.media.storage import S3MediaStorage
from app.modules.media.validation import DisabledMalwareScanner
from tests.integration.test_media_management_flow import _cleanup, _create_actor

pytestmark = pytest.mark.skipif(
    not os.getenv("JAHAN_STORAGE_POLICY_TEST_URL"), reason="real isolated S3 required"
)


def test_pdf_publication_uses_real_storage_and_structural_policy() -> None:
    endpoint = os.environ["JAHAN_STORAGE_POLICY_TEST_URL"]
    suffix = uuid4().hex
    settings = Settings(
        _env_file=None,
        storage_endpoint_url=endpoint,
        storage_public_endpoint_url=endpoint,
        storage_access_key=SecretStr("synthetic-local-user"),
        storage_secret_key=SecretStr("synthetic-local-password-only"),
        media_quarantine_bucket="quarantine-" + suffix,
        media_public_bucket="public-" + suffix,
    )
    storage = S3MediaStorage(settings)
    # Match the service's existing bucket settings without changing global configuration.
    from collections.abc import AsyncIterator

    from app.core.database import session_factory
    from app.modules.media.repository import MediaRepository
    from app.modules.media.router import media_service
    from app.modules.media.service import MediaService
    from app.modules.media.validation import MediaContentValidator

    async def service_override() -> AsyncIterator[MediaService]:
        async with session_factory() as session:
            yield MediaService(
                MediaRepository(session),
                storage,
                MediaContentValidator(1000000),
                DisabledMalwareScanner(),
                settings,
            )

    actor = _create_actor()
    assets: list[UUID] = []
    app.dependency_overrides[authorization_context] = lambda: AuthorizationContext(
        actor,
        (RoleGrant("content_editor", "global", None, frozenset({"media.write", "media.read"})),),
    )
    app.dependency_overrides[media_service] = service_override
    for bucket in [settings.media_quarantine_bucket, settings.media_public_bucket]:
        storage._internal.create_bucket(Bucket=bucket)
    try:
        with TestClient(app) as api, httpx.Client() as http:
            for case in ["passive", "javascript", "indirect-3d"]:
                active = case != "passive"
                writer = PdfWriter()
                page = writer.add_blank_page(width=100, height=100)
                if case == "javascript":
                    writer.root_object[NameObject("/OpenAction")] = DictionaryObject(
                        {
                            NameObject("/S"): NameObject("/JavaScript"),
                            NameObject("/JS"): TextStringObject("void(0)"),
                        }
                    )
                elif case == "indirect-3d":
                    stream = DecodedStreamObject()
                    stream.set_data(b"synthetic non-executable 3D fixture")
                    stream[NameObject("/Type")] = NameObject("/3D")
                    stream[NameObject("/Subtype")] = NameObject("/U3D")
                    annotation = DictionaryObject(
                        {
                            NameObject("/Type"): NameObject("/Annot"),
                            NameObject("/Subtype"): writer._add_object(NameObject("/3D")),
                            NameObject("/3DD"): writer._add_object(stream),
                        }
                    )
                    page[NameObject("/Annots")] = ArrayObject([writer._add_object(annotation)])
                output = io.BytesIO()
                writer.write(output)
                content = output.getvalue()
                result = api.post(
                    "/api/v1/admin/media/upload-intents",
                    json={
                        "filename": "guide.pdf",
                        "mimeType": "application/pdf",
                        "sizeBytes": len(content),
                        "purpose": "public_file",
                    },
                )
                assert result.status_code == 201, result.text
                intent = result.json()["data"]
                assets.append(UUID(intent["id"]))
                assert intent["method"] == "POST"
                uploaded = http.post(
                    intent["uploadUrl"],
                    data=intent["fields"],
                    files={"file": ("guide.pdf", content, "application/pdf")},
                )
                assert uploaded.status_code in {200, 201, 204}
                confirmed = api.post(
                    f"/api/v1/admin/media/{intent['id']}/confirm",
                    json={"checksumSha256": hashlib.sha256(content).hexdigest()},
                )
                assert confirmed.status_code == (422 if active else 202), confirmed.text
                if active:
                    assert confirmed.json()["error"]["code"] == "MEDIA_PDF_ACTIVE_CONTENT_REJECTED"
            objects = storage._internal.list_objects_v2(Bucket=settings.media_public_bucket)
            assert objects.get("KeyCount", 0) == 1
    finally:
        app.dependency_overrides.clear()
        _cleanup(actor, assets)
        for bucket in [settings.media_quarantine_bucket, settings.media_public_bucket]:
            for obj in storage._internal.list_objects_v2(Bucket=bucket).get("Contents", []):
                storage._internal.delete_object(Bucket=bucket, Key=obj["Key"])
            storage._internal.delete_bucket(Bucket=bucket)


async def test_real_storage_enforces_exact_size_type_key_and_signature() -> None:
    endpoint = os.environ["JAHAN_STORAGE_POLICY_TEST_URL"]
    settings = Settings(
        _env_file=None,
        storage_endpoint_url=endpoint,
        storage_public_endpoint_url=endpoint,
        storage_access_key=SecretStr("synthetic-local-user"),
        storage_secret_key=SecretStr("synthetic-local-password-only"),
    )
    client = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id="synthetic-local-user",
        aws_secret_access_key="synthetic-local-password-only",
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )
    bucket = "media-policy-" + uuid4().hex
    for attempt in range(20):
        try:
            client.create_bucket(Bucket=bucket)
            break
        except Exception:
            if attempt == 19:
                raise
            await asyncio.sleep(0.25)
    try:
        storage = S3MediaStorage(settings)
        form = await storage.create_upload_url(bucket, "exact.pdf", "application/pdf", 60, 32)
        async with httpx.AsyncClient() as http:
            for size in [31, 33, 4096]:
                response = await http.post(
                    form.url,
                    data=form.fields,
                    files={"file": ("test.pdf", b"x" * size, "application/pdf")},
                )
                assert response.status_code >= 400
            assert client.list_objects_v2(Bucket=bucket).get("KeyCount", 0) == 0
            accepted = await http.post(
                form.url,
                data=form.fields,
                files={"file": ("test.pdf", b"x" * 32, "application/pdf")},
            )
            assert accepted.status_code in {200, 201, 204}, accepted.text
            assert client.head_object(Bucket=bucket, Key="exact.pdf")["ContentLength"] == 32
            for fields in [
                {**form.fields, "Content-Type": "text/html"},
                {**form.fields, "key": "other.pdf"},
                {**form.fields, "policy": form.fields["policy"][:-4] + "AAAA"},
            ]:
                rejected = await http.post(
                    form.url,
                    data=fields,
                    files={"file": ("test.pdf", b"x" * 32, "application/pdf")},
                )
                assert rejected.status_code >= 400
            unsigned = await http.put(form.url + "/unsigned.pdf", content=b"x" * 32)
            assert unsigned.status_code >= 400
    finally:
        for item in client.list_objects_v2(Bucket=bucket).get("Contents", []):
            client.delete_object(Bucket=bucket, Key=item["Key"])
        client.delete_bucket(Bucket=bucket)
