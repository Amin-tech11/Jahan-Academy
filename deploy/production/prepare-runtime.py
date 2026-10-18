"""Prepare isolated runtime secrets without printing them or changing unrelated services."""

from __future__ import annotations

import base64
import ipaddress
import os
import re
import secrets
import sys
from pathlib import Path

PROJECT_ROOT = Path("/opt/jahan-academy-test")


def prepare(root: Path, template: Path, gateway: str) -> None:
    if root.resolve() != PROJECT_ROOT:
        raise ValueError("Unexpected production path")
    ipaddress.ip_address(gateway)
    runtime = root / "runtime.env"
    lines = runtime.read_text().splitlines()
    values = dict(
        line.split("=", 1)
        for line in lines
        if line and not line.startswith("#") and "=" in line
    )
    # The admin proxy must forward the same double-submit cookie the API expects.
    # This is a cookie name, never a CSRF token or an authentication secret.
    csrf_cookie_name = values.get("JAHAN_CSRF_COOKIE_NAME", "jahan_csrf")
    if not re.fullmatch(r"[A-Za-z0-9_-]+", csrf_cookie_name):
        raise ValueError("Invalid CSRF cookie name")
    key = values.get("JAHAN_TRUSTED_PROXY_SECRET") or secrets.token_urlsafe(48)
    if len(key) < 32 or not all(c.isalnum() or c in "_-" for c in key):
        raise ValueError("Invalid proxy credential")
    values["JAHAN_TRUSTED_PROXY_SECRET"] = key
    values.setdefault(
        "JAHAN_MFA_ENCRYPTION_KEY",
        base64.urlsafe_b64encode(secrets.token_bytes(32)).decode(),
    )
    # Until a real SMTP service exists, report unavailability rather than false delivery success.
    values.setdefault("JAHAN_EMAIL_DELIVERY_ENABLED", "false")
    replacements = {
        "JAHAN_TRUSTED_PROXY_SECRET",
        "JAHAN_EMAIL_DELIVERY_ENABLED",
        "JAHAN_MFA_ENCRYPTION_KEY",
    }
    lines = [line for line in lines if line.split("=", 1)[0] not in replacements]
    lines += [f"{name}={values[name]}" for name in sorted(replacements)]
    files = {
        runtime: "\n".join(lines) + "\n",
        root
        / "frontend.env": "API_INTERNAL_URL=http://backend:8000\nADMIN_API_URL=http://backend:8000\nADMIN_PUBLIC_ORIGIN=https://jahanacademi.ir\nNEXT_PUBLIC_API_BASE_URL=/api/v1\n"
        + f"ADMIN_CSRF_COOKIE={csrf_cookie_name}\n"
        + f"JAHAN_TRUSTED_PROXY_SECRET={key}\n",
        root
        / "proxy-headers.conf": "proxy_set_header X-Jahan-Client-IP $remote_addr;\n"
        + f'proxy_set_header X-Jahan-Proxy-Key "{key}";\n'
        + 'proxy_set_header X-Forwarded-For "";\n',
        root / "preview.conf": template.read_text().replace("@GATEWAY@", gateway),
    }
    for path, contents in files.items():
        temporary = path.with_suffix(path.suffix + ".new")
        descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "w") as output:
            output.write(contents)
        temporary.replace(path)


if __name__ == "__main__":
    prepare(Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3])
