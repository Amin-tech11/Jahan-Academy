"""Local status only: no external notification service or user data in logs."""

from __future__ import annotations

import json
import shutil
import subprocess
from datetime import UTC, datetime
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

ROOT = Path("/opt/jahan-academy-test")


def status() -> dict[str, object]:
    result: dict[str, object] = {"time": datetime.now(UTC).isoformat()}
    for name, url in {
        "website": "https://jahanacademi.ir/fa",
        "admin": "https://jahanacademi.ir/fa/admin",
        "api": "https://jahanacademi.ir/health/ready",
    }.items():
        try:
            with urlopen(
                url, timeout=10
            ) as response:  # Fixed HTTPS URLs, never user input.
                result[name] = response.status
        except (OSError, URLError):
            result[name] = "unavailable"
    try:
        completed = subprocess.run(
            ["docker", "compose", "-p", "jahan-academy-test", "ps", "--format", "json"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=15,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        completed = subprocess.CompletedProcess([], 1, "", "")
    try:
        payload = completed.stdout.strip()
        containers = (
            json.loads(payload)
            if payload.startswith("[")
            else [json.loads(line) for line in payload.splitlines() if line]
        )
        result["services"] = {
            row["Service"]: {"state": row["State"], "health": row.get("Health", "")}
            for row in containers
        }
    except (ValueError, KeyError, TypeError):
        result["services"] = "unavailable"
    now = datetime.now(UTC).timestamp()
    backups = list((ROOT / "backups").glob("jahan-*.dump"))
    result["backup_age_hours"] = (
        round((now - max(p.stat().st_mtime for p in backups)) / 3600, 2)
        if backups
        else None
    )
    offsite = ROOT / "offsite-backup-success"
    result["offsite_backup"] = (
        round((now - offsite.stat().st_mtime) / 3600, 2)
        if offsite.exists()
        else "no_successful_copy"
        if (ROOT / "offsite-backup.env").exists()
        else "not_configured"
    )
    retention = ROOT / "retention-success"
    result["retention_age_hours"] = (
        round((now - retention.stat().st_mtime) / 3600, 2)
        if retention.exists()
        else None
    )
    result["disk_free_mb"] = shutil.disk_usage(ROOT).free // (1024 * 1024)
    result["healthy"] = (
        all(result[name] == 200 for name in ("website", "admin", "api"))
        and completed.returncode == 0
        and isinstance(result["services"], dict)
        and {"db", "redis", "backend", "frontend", "preview"}.issubset(
            result["services"]
        )
        and all(
            row["state"] == "running" and row["health"] == "healthy"
            for name, row in result["services"].items()
            if name != "migrate"
        )
        and result["backup_age_hours"] is not None
        and result["backup_age_hours"] < 26
        and result["retention_age_hours"] is not None
        and result["retention_age_hours"] < 26
        and result["disk_free_mb"] > 1024
        and (
            not (ROOT / "offsite-backup.env").exists()
            or (
                isinstance(result["offsite_backup"], (int, float))
                and result["offsite_backup"] < 26
            )
        )
    )
    return result


if __name__ == "__main__":
    report = status()
    with (ROOT / "operations.jsonl").open("a") as output:
        output.write(json.dumps(report) + "\n")
    print(json.dumps(report))
    raise SystemExit(0 if report["healthy"] else 1)
