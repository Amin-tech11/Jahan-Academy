# Authentication resource budget and local backup protection

Scope: develop, localhost:5000, 2026-10-18. No schema or dependency changes.
Home-page code/assets are unchanged. No push, merge, remote CI, Google write or
production deployment is part of this work.

## Authentication

`AuthSecurity` construction no longer hashes a dummy password. Its fixed dummy
hash is a public dummy value, never an account credential. A lock makes cached
security initialization single-flight even on simultaneous first requests.

All API password hash, verification and dummy-check paths use `password_work`:
registration, login, reset, staff creation, MFA and administrative reauthentication.
Native Argon2 runs in one dedicated worker thread, leaving the event loop available.
Nonblocking admission permits one expensive operation per API process, sharing the
existing media-processing budget. There is no waiting job queue. Saturation returns
503 `AUTH_CRYPTO_BUSY`, `Retry-After: 1`, and `Cache-Control: no-store`; the panel
shows a retry message without automatically resubmitting credentials. A media
publication can also make authentication temporarily busy, and vice versa.

The slot remains reserved until the native future actually finishes, including
caller cancellation and exceptions. Argon2's existing 64-MiB/time-3/parallelism-4
parameters, password policy, rate limiting, MFA and session checks are preserved.
Offline synchronous security utilities remain available for CLI/test setup.
The limit is per process: adding API worker processes requires budgeting aggregate
memory and CPU, rather than assuming this is a deployment-wide semaphore.

## Windows local safety copies

`LocalBackupProtection.psm1` uses Windows DPAPI **CurrentUser**, with no plaintext
fallback. PowerShell 7 is required. Ciphertext is written to a unique partial file,
flushed, read back, decrypted and SHA-256 checked before an atomic rename. Existing
destinations are never overwritten. Legacy protection removes a source only after
the saved ciphertext matches its original content and the source still matches.
Locked, changed or mismatched sources are retained on failure.

The manual Sheets export now writes only unique `.json.dpapi` files. It retains
protected daily outbox exports for less than 14 days, using Tehran calendar dates;
cleanup is nonrecursive and decrypts candidate files before deletion. It does not
touch manually named recovery archives. Database extraction and Google behavior
are unchanged; preparing an export does not write to Google.

The following known plaintext recovery archives were migrated in this checkout:

| Current path under `.backup-outbox/redis-20261017-repair/` | SHA-256 of decrypted content |
| --- | --- |
| `database-before-027.dump.dpapi` | `F640E84B0116974981968845C54C7A4679F3FCFDF107E13EAE53D2D91E2824B0` |
| `redis-before-repair.tar.gz.dpapi` | `F36B12A761FAAE61479813201811E32B414BB52A3B9DB2C858CC510227B74946` |

Both restored hashes matched the October 17 recovery report, and both original
plaintext paths are absent. No archive contents or keys were logged or committed.
The ignored `.operations-hardening/auth-backup-protection/migration.json` contains
only paths, verification status and these hashes. This does not claim to erase
deleted disk sectors, OS snapshots or copies in other checkouts/devices.

## Recovery and migration

Keep the originating Windows account/profile and its DPAPI recovery mechanism
available. Copying `.dpapi` files alone to a different user or freshly installed
system does not provide portable recovery. Production/offsite backups continue to
use the existing streaming age workflow and separately managed recovery keys.
Local DPAPI operations reject files above 128 MiB; use that age workflow for larger
backups. Encryption at rest does not restrict a process already running as this user.

To read a local copy **into memory**, on the originating Windows profile:

```powershell
Import-Module ./scripts/LocalBackupProtection.psm1
[byte[]]$restoredBytes = Read-ProtectedBackup -LiteralPath $encryptedBackupPath
```

Do not print these bytes or persist a plaintext export by default. A database or
Redis restore is a separate operational action requiring its own target verification;
the protection scripts never restore services automatically.

For explicitly selected legacy files, run from the checkout root:

```powershell
# Default is metadata-only dry run; accepts paths only inside this checkout.
./scripts/protect-local-backups.ps1 -LiteralPath $legacyBackupPath
./scripts/protect-local-backups.ps1 -LiteralPath $legacyBackupPath -Apply
```

Rerunning with `-Apply` after successful migration validates the existing ciphertext
without requiring or recreating the removed plaintext. Preserve the original until
verification succeeds; do not manually delete a failed source.

## Verification

Backend regression tests cover cache single-flight, no construction-time Argon2,
event-loop availability, immediate overload rejection, cancellation, native failure
and the shared media budget. Isolated integration tests exercise real PostgreSQL,
Redis and MinIO, including password/MFA/step-up and media flows.
The Windows script `test-local-backup-protection.ps1` checks real DPAPI roundtrip,
plaintext removal, tamper rejection, conflicting destination, locked-source safety
and scoped expiry. A Windows CI job is included for future authorized pushes;
remote CI has not been run for this local-only change.

Local results:

- 238 backend unit/architecture/contract tests passed; Ruff and formatting passed.
- 55 isolated integration tests passed, plus the newly added HTTP saturation test
  passed separately (56 integration cases in total). Mypy passed for 214 files.
- All 218 frontend Node tests passed; the webpack production build and its
  TypeScript stage succeeded.
- Nine Edge browser regressions passed on localhost:5000: upload, MFA enrollment,
  administrative step-up/cancel, password recovery, throttling and both home locales.
- Six real Windows DPAPI checks passed. Idempotent validation of both migrated
  legacy archives also passed, with plaintext paths absent.
- A live six-request login burst through the port-5000 panel proxy returned one
  expected invalid-login 401 and five `AUTH_CRYPTO_BUSY` 503 responses with
  `Retry-After: 1`. No account was created. An initial harness request omitted the
  browser Origin header and was correctly rejected with 403; the corrected probe
  used the panel's username payload and same-origin header.
- `/admin`, `/fa`, `/en` on port 5000 and API `/health/ready` returned 200.

Existing dependency deprecation/module-type warnings remain; no test failed in the
completed suites. Database/permission design and migrations do not apply to these
changes. Production/offsite restore and remote CI were not executed. The dedicated
develop API alone was restarted to load the changed bind-mounted code; temporary
test containers are removed after verification.

Changed implementation files: `backend/app/core/work_budget.py`,
`backend/app/modules/identity/{password_work,dependencies,security,service,staff_service}.py`,
`backend/app/modules/media/service.py`, `frontend/lib/admin-api.ts`,
`scripts/{LocalBackupProtection.psm1,protect-local-backups.ps1,prepare-sheets-backup.ps1}`.
Tests: `backend/tests/unit/{test_password_work,test_media_publication}.py`,
`backend/tests/integration/test_auth_abuse_flow.py`,
`scripts/test-local-backup-protection.ps1`. CI: `.github/workflows/ci-cd.yml`.
Documentation: this guide, `GOOGLE_SHEETS_BACKUP.md` and
`docs/local-redis-recovery-2026-10-17.md`.

Sources: [Microsoft ProtectedData](https://learn.microsoft.com/dotnet/api/system.security.cryptography.protecteddata)
and [Python Future cancellation](https://docs.python.org/3.12/library/concurrent.futures.html#concurrent.futures.Future.cancel).
