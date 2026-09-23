from __future__ import annotations

import asyncio
from collections.abc import Callable
from dataclasses import dataclass
from typing import Protocol, TypeVar

import boto3  # type: ignore[import-untyped]
from botocore.client import Config  # type: ignore[import-untyped]
from botocore.exceptions import BotoCoreError, ClientError  # type: ignore[import-untyped]

from app.core.config import Settings


class StorageError(Exception):
    pass


T = TypeVar("T")


@dataclass(frozen=True, slots=True)
class StoredObject:
    size_bytes: int
    content_type: str | None


class MediaStorage(Protocol):
    async def create_upload_url(
        self, bucket: str, object_key: str, content_type: str, expires_seconds: int
    ) -> str: ...

    async def head(self, bucket: str, object_key: str) -> StoredObject: ...
    async def read(self, bucket: str, object_key: str, max_bytes: int) -> bytes: ...
    async def promote(
        self, source_bucket: str, source_key: str, target_bucket: str, target_key: str
    ) -> None: ...
    async def delete(self, bucket: str, object_key: str) -> None: ...
    async def create_download_url(
        self, bucket: str, object_key: str, expires_seconds: int
    ) -> str: ...


class S3MediaStorage:
    def __init__(self, settings: Settings) -> None:
        common = {
            "aws_access_key_id": settings.storage_access_key.get_secret_value(),
            "aws_secret_access_key": settings.storage_secret_key.get_secret_value(),
            "region_name": settings.storage_region,
            "config": Config(signature_version="s3v4", s3={"addressing_style": "path"}),
        }
        self._internal = boto3.client("s3", endpoint_url=settings.storage_endpoint_url, **common)
        self._public = boto3.client(
            "s3", endpoint_url=settings.storage_public_endpoint_url, **common
        )

    async def create_upload_url(
        self, bucket: str, object_key: str, content_type: str, expires_seconds: int
    ) -> str:
        def generate() -> str:
            return str(
                self._public.generate_presigned_url(
                    "put_object",
                    Params={"Bucket": bucket, "Key": object_key, "ContentType": content_type},
                    ExpiresIn=expires_seconds,
                )
            )

        return await self._call(generate)

    async def head(self, bucket: str, object_key: str) -> StoredObject:
        def execute() -> StoredObject:
            result = self._internal.head_object(Bucket=bucket, Key=object_key)
            return StoredObject(
                size_bytes=int(result["ContentLength"]), content_type=result.get("ContentType")
            )

        return await self._call(execute)

    async def read(self, bucket: str, object_key: str, max_bytes: int) -> bytes:
        def execute() -> bytes:
            response = self._internal.get_object(Bucket=bucket, Key=object_key)
            stream = response["Body"]
            try:
                data = stream.read(max_bytes + 1)
            finally:
                stream.close()
            if len(data) > max_bytes:
                raise StorageError("STORAGE_OBJECT_TOO_LARGE")
            return bytes(data)

        return await self._call(execute)

    async def promote(
        self, source_bucket: str, source_key: str, target_bucket: str, target_key: str
    ) -> None:
        def execute() -> None:
            self._internal.copy_object(
                Bucket=target_bucket,
                Key=target_key,
                CopySource={"Bucket": source_bucket, "Key": source_key},
                MetadataDirective="COPY",
            )
            self._internal.delete_object(Bucket=source_bucket, Key=source_key)

        await self._call(execute)

    async def delete(self, bucket: str, object_key: str) -> None:
        await self._call(lambda: self._internal.delete_object(Bucket=bucket, Key=object_key))

    async def create_download_url(self, bucket: str, object_key: str, expires_seconds: int) -> str:
        def generate() -> str:
            return str(
                self._public.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": bucket, "Key": object_key},
                    ExpiresIn=expires_seconds,
                )
            )

        return await self._call(generate)

    @staticmethod
    async def _call(operation: Callable[[], T]) -> T:
        try:
            return await asyncio.to_thread(operation)
        except StorageError:
            raise
        except (BotoCoreError, ClientError, OSError) as exc:
            raise StorageError("STORAGE_OPERATION_FAILED") from exc
