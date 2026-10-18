#!/usr/bin/env python3
"""Forced SSH command: release only this repository's verified current main."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path("/opt/jahan-academy-test")
REPO = "Amin-tech11/Jahan-Academy"
IMAGE = "ghcr.io/amin-tech11/jahan-academy/"
PATTERN = re.compile(
    r"jahan-deploy ([0-9a-f]{40}) "
    r"(ghcr\.io/amin-tech11/jahan-academy/backend@sha256:[0-9a-f]{64}) "
    r"(ghcr\.io/amin-tech11/jahan-academy/frontend@sha256:[0-9a-f]{64}) "
    r"([a-zA-Z0-9_\[\]-]+)"
)
GATES = {
    "Lint",
    "Unit Tests",
    "Browser and Accessibility Tests",
    "Integration Tests",
    "Build",
    "Security Checks",
    "Publish Image",
}


def parse_command(command: str) -> tuple[str, str, str, str]:
    match = PATTERN.fullmatch(command)
    if not match:
        raise ValueError("Only the Jahan Academy deployment command is permitted")
    return match.groups()


def api(path: str) -> dict:
    request = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/{path}",
        headers={
            "User-Agent": "Jahan-Academy-deploy",
            "Accept": "application/vnd.github+json",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def verify_release(sha: str) -> None:
    if api("commits/main")["sha"] != sha:
        raise ValueError("Release must be the current reviewed main commit")
    runs = api(f"commits/{sha}/check-runs?per_page=100")["check_runs"]
    # The newest result for each gate must pass; an older successful retry is insufficient.
    latest = {}
    for run in sorted(runs, key=lambda item: item["id"], reverse=True):
        if run["app"]["slug"] == "github-actions":
            latest.setdefault(run["name"], run["conclusion"])
    if any(latest.get(gate) != "success" for gate in GATES):
        raise ValueError("Required main CI and image publication must all succeed")


def safe_members(archive: tarfile.TarFile, prefix: str) -> list:
    members = archive.getmembers()
    for member in members:
        parts = Path(member.name).parts
        if (
            not parts
            or parts[0] != prefix
            or ".." in parts
            or member.name.startswith("/")
            or not (member.isfile() or member.isdir())
        ):
            raise ValueError("Invalid source archive member")
    return members


def source_release(sha: str) -> Path:
    releases = ROOT / "releases"
    releases.mkdir(mode=0o700, exist_ok=True)
    target = releases / sha
    marker = target / ".gateway-verified-main"
    if target.exists():
        if not marker.is_file() or marker.read_text().strip() != sha:
            raise ValueError("Existing release directory is not gateway verified")
        return target
    with tempfile.TemporaryDirectory(prefix=".gateway-", dir=releases) as temp:
        staging = Path(temp)
        packed = staging / "source.tar.gz"
        with (
            urllib.request.urlopen(
                f"https://codeload.github.com/{REPO}/tar.gz/{sha}", timeout=120
            ) as response,
            packed.open("wb") as output,
        ):
            shutil.copyfileobj(response, output)
        prefix = f"Jahan-Academy-{sha}"
        with tarfile.open(packed, "r:gz") as archive:
            archive.extractall(
                staging, members=safe_members(archive, prefix), filter="data"
            )
        unpacked = staging / prefix
        (unpacked / ".gateway-verified-main").write_text(sha + "\n")
        unpacked.rename(target)
    return target


def main() -> None:
    os.umask(0o077)
    command = os.environ.get("SSH_ORIGINAL_COMMAND", "")
    if command == "jahan-check":
        print("Jahan Academy restricted deployment gateway ready")
        return
    sha, backend, frontend, actor = parse_command(command)
    token = sys.stdin.buffer.read(4097)
    if not token or len(token) > 4096:
        raise ValueError("A bounded registry credential is required on stdin")
    verify_release(sha)
    release = source_release(sha)
    with tempfile.TemporaryDirectory(prefix=".registry-", dir=ROOT) as config:
        env = {**os.environ, "DOCKER_CONFIG": config}
        subprocess.run(
            ["docker", "login", "ghcr.io", "-u", actor, "--password-stdin"],
            input=token,
            env=env,
            check=True,
            timeout=60,
            stdout=subprocess.DEVNULL,
        )
        subprocess.run(
            [
                "bash",
                str(release / "deploy/production/release.sh"),
                sha,
                backend,
                frontend,
            ],
            env=env,
            check=True,
            timeout=1500,
        )


if __name__ == "__main__":
    try:
        main()
    except (
        OSError,
        ValueError,
        KeyError,
        TypeError,
        tarfile.TarError,
        subprocess.SubprocessError,
        urllib.error.URLError,
    ):
        # Avoid logging registry credentials or remote error bodies.
        print(
            "Jahan Academy release failed; inspect project release/CI status.",
            file=sys.stderr,
        )
        sys.exit(1)
