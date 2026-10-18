"""Exercise real age encryption; all commands and data live in disposable test paths."""

import hashlib
import json
import os
import shutil
import subprocess
import tempfile
import time
import unittest
from pathlib import Path


@unittest.skipUnless(os.name == "posix" and shutil.which("age") and shutil.which("age-keygen"),
                     "requires Linux and age; installed in the operations CI job")
class BackupEncryptionTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.identity = self.root / "test-identity"
        subprocess.run(["age-keygen", "-o", str(self.identity)], check=True, capture_output=True)
        self.recipient = subprocess.check_output(["age-keygen", "-y", str(self.identity)], text=True).strip()
        self.real_age = shutil.which("age")
        self.config = self.root / "backup-encryption.env"
        self.config.write_text(f"AGE_RECIPIENT={self.recipient}\n")
        self.payload = b"PGDMP synthetic test data: never personal data\n"
        self.script = self.root / "backup.sh"
        source = Path(__file__).with_name("backup.sh").read_text()
        self.script.write_text(source.replace("root=/opt/jahan-academy-test", f"root='{self.root}'"))
        self.env = {**os.environ, "PATH": str(self.bin)+os.pathsep+os.environ["PATH"], "TEST_ROOT": str(self.root)}
        self.env.pop("AGE_RECIPIENT", None)
        self.env.pop("BACKUP_TEST_SOURCE_DSN", None)
        self.env.pop("BACKUP_TEST_RESTORE_DSN", None)
        self.command("docker", """#!/usr/bin/env python3
import os, subprocess, sys
from pathlib import Path
Path(os.environ['TEST_ROOT'], 'dump-called').touch()
if os.environ.get('BACKUP_TEST_SOURCE_DSN'):
    raise SystemExit(subprocess.run(['pg_dump', os.environ['BACKUP_TEST_SOURCE_DSN'], '-Fc']).returncode)
sys.stdout.buffer.write(b'PGDMP synthetic test data: never personal data\\n')
raise SystemExit(int(os.environ.get('FAIL_DUMP', '0')))
""")
        self.command("age", f"""#!/usr/bin/env python3
import os, sys
if '-o' in sys.argv and os.environ.get('FAIL_ENCRYPT'):
    raise SystemExit(9)
os.execv({self.real_age!r}, [{self.real_age!r}, *sys.argv[1:]])
""")
        self.command("scp", """#!/usr/bin/env python3
import os, shutil, signal, sys, time
from pathlib import Path
if os.environ.get('HANG_COPY'):
    signal.signal(signal.SIGTERM, signal.SIG_IGN)
    time.sleep(60)
if os.environ.get('FAIL_COPY'):
    raise SystemExit(10)
out = Path(os.environ['TEST_ROOT'], 'offsite'); out.mkdir(exist_ok=True)
shutil.copy(sys.argv[-2], out)
""")

    def command(self, name, contents):
        path = self.bin / name
        path.write_text(contents)
        path.chmod(0o755)

    def run_backup(self):
        return subprocess.run(["bash", str(self.script)], env=self.env, capture_output=True, timeout=20)

    def archives(self):
        return list((self.root / "backups").glob("*.dump.age"))

    def assert_no_plaintext_or_partial(self):
        self.assertFalse(list((self.root / "backups").glob("*.dump")))
        self.assertFalse(list((self.root / "backups").glob("*.partial")))

    def test_encrypted_local_backup_roundtrip_and_checksum(self):
        completed = self.run_backup()
        self.assertEqual(completed.returncode, 0, completed.stderr.decode())
        archive, = self.archives()
        decrypted = subprocess.check_output([self.real_age, "-d", "-i", str(self.identity), str(archive)])
        self.assertEqual(decrypted, self.payload)
        self.assertNotIn(self.payload, archive.read_bytes())
        self.assertEqual(archive.stat().st_mode & 0o777, 0o600)
        self.assertTrue(archive.with_suffix(".age.sha256").read_text().startswith(hashlib.sha256(archive.read_bytes()).hexdigest()))
        self.assertEqual(archive.with_suffix(".age.sha256").read_text().split()[1], archive.name)
        self.assert_no_plaintext_or_partial()
        result = json.loads((self.root / "operations.jsonl").read_text())
        self.assertTrue(result["encrypted"])
        self.assertEqual(result["offsite"], "not_configured")
        # An unrelated identity must not decrypt the backup.
        wrong = self.root / "wrong-identity"
        subprocess.run(["age-keygen", "-o", str(wrong)], check=True, capture_output=True)
        self.assertNotEqual(subprocess.run([self.real_age, "-d", "-i", str(wrong), str(archive)], capture_output=True).returncode, 0)
        tampered = self.root / "tampered.age"
        ciphertext = bytearray(archive.read_bytes())
        ciphertext[-1] ^= 1
        tampered.write_bytes(ciphertext)
        self.assertNotEqual(subprocess.run([self.real_age, "-d", "-i", str(self.identity), str(tampered)], capture_output=True).returncode, 0)

    def test_missing_or_invalid_recipient_fails_before_dump(self):
        for recipient in (None, "age1invalidchecksum"):
            with self.subTest(recipient=recipient):
                if recipient is None:
                    self.config.unlink()
                else:
                    self.config.write_text(f"AGE_RECIPIENT={recipient}\n")
                self.assertNotEqual(self.run_backup().returncode, 0)
                self.assertFalse((self.root / "dump-called").exists())
                self.assertFalse(self.archives())
                self.assert_no_plaintext_or_partial()

    def test_dump_and_encryption_failures_leave_no_completed_backup(self):
        for failure in ("FAIL_DUMP", "FAIL_ENCRYPT"):
            with self.subTest(failure=failure):
                self.env[failure] = "9"
                self.assertNotEqual(self.run_backup().returncode, 0)
                self.assertFalse(self.archives())
                self.assert_no_plaintext_or_partial()
                self.env.pop(failure)

    def test_offsite_receives_ciphertext_and_copy_failure_retains_local_backup(self):
        (self.root / "offsite-backup.env").write_text("OFFSITE_SSH_TARGET=test@backup.example:/test\n")
        self.env["FAIL_COPY"] = "1"
        self.assertNotEqual(self.run_backup().returncode, 0)
        self.assertEqual(len(self.archives()), 1)
        self.assertFalse((self.root / "offsite-backup-success").exists())
        self.env.pop("FAIL_COPY")
        completed = self.run_backup()
        self.assertEqual(completed.returncode, 0, completed.stderr.decode())
        self.assertTrue((self.root / "offsite-backup-success").exists())
        copied = list((self.root / "offsite").glob("*.dump.age"))
        self.assertEqual(len(copied), 1)
        self.assertEqual(subprocess.check_output([self.real_age, "-d", "-i", str(self.identity), str(copied[0])]), self.payload)
        self.assert_no_plaintext_or_partial()

    def test_stalled_copy_has_deadline_and_lock_is_released(self):
        (self.root / "offsite-backup.env").write_text("OFFSITE_SSH_TARGET=test@backup.example:/test\n")
        for deadline in ("BACKUP_TRANSFER_TIMEOUT_SECONDS", "BACKUP_TIMEOUT_SECONDS"):
            with self.subTest(deadline=deadline):
                self.env[deadline] = "1"
                self.env["HANG_COPY"] = "1"
                started = time.monotonic()
                self.assertNotEqual(self.run_backup().returncode, 0)
                self.assertLess(time.monotonic()-started, 10)
                self.assert_no_plaintext_or_partial()
                self.env.pop("HANG_COPY")
                self.env.pop(deadline)
                before = len(self.archives())
                self.assertEqual(self.run_backup().returncode, 0)
                self.assertEqual(len(self.archives()), before+1)

    def test_copy_failure_does_not_prevent_retention(self):
        self.assertEqual(self.run_backup().returncode, 0)
        old, = self.archives()
        for path in (old, old.with_suffix(".age.sha256")):
            os.utime(path, (time.time()-16*86400, time.time()-16*86400))
        (self.root / "offsite-backup.env").write_text("OFFSITE_SSH_TARGET=test@backup.example:/test\n")
        self.env["FAIL_COPY"] = "1"
        self.assertNotEqual(self.run_backup().returncode, 0)
        self.assertFalse(old.exists())
        self.assertEqual(len(self.archives()), 1)

    @unittest.skipUnless(os.getenv("BACKUP_TEST_SOURCE_DSN") and os.getenv("BACKUP_TEST_RESTORE_DSN"),
                         "optional full restore drill uses disposable PostgreSQL databases")
    def test_encrypted_database_backup_restores_to_isolated_database(self):
        source = os.environ["BACKUP_TEST_SOURCE_DSN"]
        restore = os.environ["BACKUP_TEST_RESTORE_DSN"]
        self.env["BACKUP_TEST_SOURCE_DSN"] = source
        self.assertTrue(source.endswith("/security_test"))
        self.assertTrue(restore.endswith("/security_restore_test"))
        self.assertNotEqual(source, restore)
        subprocess.run(["psql", source, "-v", "ON_ERROR_STOP=1", "-c",
                        "DROP TABLE IF EXISTS encryption_restore_fixture; CREATE TABLE encryption_restore_fixture (value text); INSERT INTO encryption_restore_fixture VALUES ('synthetic-restore-ok');"],
                       check=True, capture_output=True)
        completed = self.run_backup()
        self.assertEqual(completed.returncode, 0, completed.stderr.decode())
        archive, = self.archives()
        plaintext = subprocess.check_output([self.real_age, "-d", "-i", str(self.identity), str(archive)])
        subprocess.run(["pg_restore", "--exit-on-error", "--dbname", restore], input=plaintext, check=True, capture_output=True)
        value = subprocess.check_output(["psql", restore, "-Atc", "SELECT value FROM encryption_restore_fixture"], text=True).strip()
        self.assertEqual(value, "synthetic-restore-ok")
        self.assert_no_plaintext_or_partial()


if __name__ == "__main__":
    unittest.main()
