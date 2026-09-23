from __future__ import annotations

import boto3  # type: ignore[import-untyped]
from botocore.client import Config  # type: ignore[import-untyped]
from botocore.exceptions import ClientError  # type: ignore[import-untyped]

from app.core.config import get_settings


def main() -> None:
    settings = get_settings()
    client = boto3.client(
        "s3",
        endpoint_url=settings.storage_endpoint_url,
        aws_access_key_id=settings.storage_access_key.get_secret_value(),
        aws_secret_access_key=settings.storage_secret_key.get_secret_value(),
        region_name=settings.storage_region,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )
    for bucket in (settings.media_quarantine_bucket, settings.media_public_bucket):
        try:
            client.create_bucket(Bucket=bucket)
        except ClientError as exc:
            code = str(exc.response.get("Error", {}).get("Code", ""))
            if code not in {"BucketAlreadyExists", "BucketAlreadyOwnedByYou"}:
                raise


if __name__ == "__main__":
    main()
