"""Failure-oriented tests; never connect to or change production services."""

import base64
import importlib.util
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch


def load(name, filename):
    spec = importlib.util.spec_from_file_location(
        name, Path(__file__).with_name(filename)
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


runtime = load("production_runtime", "prepare-runtime.py")
monitor = load("production_monitor", "monitor.py")


class OperationsTests(unittest.TestCase):
    def test_rejects_other_projects_before_reading_secrets(self):
        with self.assertRaises(ValueError):
            runtime.prepare(
                Path("/opt/unrelated-project"), Path("missing"), "172.19.0.1"
            )

    @unittest.skipUnless(
        hasattr(os, "fchmod"), "Linux permission validation runs in CI"
    )
    def test_runtime_secrets_stable_private_and_not_exposed_to_frontend(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "runtime.env").write_text(
                "JAHAN_SESSION_SECRET=private-session-value\n"
            )
            template = root / "template"
            template.write_text("set_real_ip_from @GATEWAY@;\n")
            with patch.object(runtime, "PROJECT_ROOT", root.resolve()):
                runtime.prepare(root, template, "172.19.0.1")
                first = (root / "runtime.env").read_text()
                runtime.prepare(root, template, "172.19.0.1")
                self.assertEqual(first, (root / "runtime.env").read_text())
                with self.assertRaises(ValueError):
                    runtime.prepare(root, template, "untrusted;value")
            values = dict(line.split("=", 1) for line in first.splitlines())
            self.assertEqual(
                len(base64.urlsafe_b64decode(values["JAHAN_MFA_ENCRYPTION_KEY"])), 32
            )
            self.assertEqual(values["JAHAN_EMAIL_DELIVERY_ENABLED"], "false")
            frontend = (root / "frontend.env").read_text()
            self.assertNotIn("private-session-value", frontend)
            self.assertNotIn(values["JAHAN_MFA_ENCRYPTION_KEY"], frontend)
            self.assertEqual((root / "runtime.env").stat().st_mode & 0o777, 0o600)

    def test_monitor_detects_missing_services_stale_jobs_and_docker_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "backups").mkdir()
            (root / "backups" / "jahan-test.dump").write_bytes(b"verified-fixture")
            (root / "retention-success").touch()
            services = [
                {"Service": name, "State": "running", "Health": "healthy"}
                for name in ("db", "redis", "backend", "frontend", "preview")
            ]
            response = SimpleNamespace(status=200, __enter__=lambda x: x)
            from contextlib import nullcontext

            with (
                patch.object(monitor, "ROOT", root),
                patch.object(monitor, "urlopen", return_value=nullcontext(response)),
                patch.object(
                    monitor.shutil,
                    "disk_usage",
                    return_value=SimpleNamespace(free=4 * 1024**3),
                ),
                patch.object(monitor.subprocess, "run") as run,
            ):
                run.return_value = subprocess.CompletedProcess(
                    [], 0, json.dumps(services), ""
                )
                self.assertTrue(monitor.status()["healthy"])
                self.assertEqual(monitor.status()["offsite_backup"], "not_configured")
                (root / "offsite-backup.env").touch()
                self.assertFalse(monitor.status()["healthy"])
                self.assertEqual(
                    monitor.status()["offsite_backup"], "no_successful_copy"
                )
                (root / "offsite-backup-success").touch()
                self.assertTrue(monitor.status()["healthy"])
                os.utime(root / "offsite-backup-success", (1, 1))
                self.assertFalse(monitor.status()["healthy"])
                (root / "offsite-backup.env").unlink()
                run.return_value = subprocess.CompletedProcess([], 0, "[null]", "")
                self.assertFalse(monitor.status()["healthy"])
                run.return_value = subprocess.CompletedProcess([], 0, "", "")
                self.assertFalse(monitor.status()["healthy"])
                run.side_effect = subprocess.TimeoutExpired("docker", 15)
                self.assertFalse(monitor.status()["healthy"])
                run.side_effect = None
                run.return_value = subprocess.CompletedProcess(
                    [], 0, json.dumps(services), ""
                )
                os.utime(root / "retention-success", (1, 1))
                self.assertFalse(monitor.status()["healthy"])


if __name__ == "__main__":
    unittest.main()
