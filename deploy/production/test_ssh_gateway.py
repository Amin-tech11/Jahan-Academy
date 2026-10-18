import importlib.util
import tarfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

spec = importlib.util.spec_from_file_location(
    "gateway", Path(__file__).with_name("ssh-gateway.py")
)
gateway = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gateway)


class GatewayTest(unittest.TestCase):
    def test_only_fixed_project_images_and_exact_arguments_are_accepted(self):
        sha = "a" * 40
        command = f"jahan-deploy {sha} {gateway.IMAGE}backend@sha256:{'b' * 64} {gateway.IMAGE}frontend@sha256:{'c' * 64} Amin-tech11"
        self.assertEqual(gateway.parse_command(command)[0], sha)
        for invalid in [
            "bash",
            "jahan-check; id",
            command + "; id",
            command.replace("jahan-academy/backend", "other/backend"),
            command.replace(sha, "../other"),
            command + " extra",
        ]:
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                gateway.parse_command(invalid)

    def test_current_main_and_all_latest_ci_gates_are_required(self):
        sha = "a" * 40
        runs = [
            {
                "id": i,
                "name": name,
                "conclusion": "success",
                "app": {"slug": "github-actions"},
            }
            for i, name in enumerate(gateway.GATES)
        ]
        with patch.object(
            gateway, "api", side_effect=[{"sha": sha}, {"check_runs": runs}]
        ):
            gateway.verify_release(sha)
        with (
            patch.object(gateway, "api", return_value={"sha": "b" * 40}),
            self.assertRaises(ValueError),
        ):
            gateway.verify_release(sha)
        latest_failure = {
            "id": 100,
            "name": "Security Checks",
            "conclusion": "failure",
            "app": {"slug": "github-actions"},
        }
        with (
            patch.object(
                gateway,
                "api",
                side_effect=[{"sha": sha}, {"check_runs": runs + [latest_failure]}],
            ),
            self.assertRaises(ValueError),
        ):
            gateway.verify_release(sha)

    def test_archive_links_traversal_and_other_roots_are_rejected(self):
        member = tarfile.TarInfo("source/file.txt")
        self.assertEqual(
            gateway.safe_members(Mock(getmembers=Mock(return_value=[member])), "source"),
            [member],
        )
        for name, kind in [
            ("source/../escape", tarfile.REGTYPE),
            ("/source/file", tarfile.REGTYPE),
            ("another/file", tarfile.REGTYPE),
            ("source/link", tarfile.SYMTYPE),
        ]:
            member = tarfile.TarInfo(name)
            member.type = kind
            with self.assertRaises(ValueError):
                gateway.safe_members(
                    Mock(getmembers=Mock(return_value=[member])), "source"
                )


if __name__ == "__main__":
    unittest.main()
