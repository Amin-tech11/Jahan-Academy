# Remaining security findings: develop remediation

Scope: the five findings from the read-only review of develop at `47d24c0`.
Local preview remains localhost:5000. No push, PR, merge, remote CI, production
deployment or real Google write was performed. Existing home content, CSS, imagery
and other panel branches were preserved.

## Sessions after panel permission changes

`PanelAccessService.replace` now revokes all target-user sessions in the same
transaction as the section change and audit event. Both existing access and refresh
credentials cease working. The user signs in again with password and MFA before
using the updated grant. Stale/failed permission changes do not revoke sessions.
Existing super-admin protection, section restrictions and row versions are retained.

## Security events and durable notifications

Authentication failures, attempts against locked accounts, actual lockouts and
successful password resets now have account-specific audit records. Unknown-account
failures use a null account ID without storing the supplied identifier. Audit data
uses the existing IP fingerprint and a bounded user agent; it never includes
passwords, reset tokens, MFA secrets or recovery codes.

Lockouts, successful resets and MFA enable/disable events enqueue security notices
using the existing `notifications` and `notification_deliveries` tables, atomically
with the associated account/audit transaction. No database migration is needed.
Stored bodies contain only fixed security messages. The destination is resolved
from the current verified email identity at delivery time, rather than persisted
as plaintext queue metadata.

`identity.security_notifications` processes at most 100 rows per run under
`FOR UPDATE SKIP LOCKED`, allowing concurrent dispatchers without simultaneous
delivery of the same row. SMTP failures retain the record and increment its attempt
count, recording only a fixed safe error code. Sent rows are not retried. There are
at most 12 attempts per delivery; exhaustion is visible in metadata and causes a
nonzero CLI result. Operators must investigate SMTP and explicitly requeue exhausted
deliveries after fixing it. Crash recovery is at-least-once: a crash after SMTP
acceptance but before database commit may cause a duplicate notice.

Celery dispatch runs every minute. The production release source adds an independent
minute cron for installations without Celery; this cron has not been deployed.
The local develop checkout has a current-user Windows task installed through
`scripts/install-security-notifications.ps1`, invoking only the dedicated develop
API through `scripts/dispatch-security-notices.ps1`. Its last task result was 0.
The task name on this device is `Jahan-Develop-SecurityNotices-8A8BC9CBE9E6`.
It is limited to logged-on operation, resumes at logon, and does not overlap itself.

The current local SMTP setting points to localhost, without TLS. No working external
mail provider or end-user delivery is claimed, and no external email was sent during
testing. Configure a valid SMTP provider before relying on delivery to real owners;
production Settings already require TLS when email is enabled. Disabled email keeps
notices pending. Connection/delivery failures retain them for retry.

Inspection without sending:

```text
python -m app.modules.identity.security_notifications
```

`--apply` enables dispatch. It prints only counts/status; never recipients or bodies.

## Independent protected local outbox expiry

`cleanup-local-backups.ps1` can expire daily encrypted exports without creating a
new export or contacting the database/Google. The module still checks DPAPI ownership
and integrity before deleting eligible files. Invalid calendar-like filenames are
ignored; manual recovery archives and subdirectories remain outside expiry scope.
The retention policy remains 14 Tehran calendar days.

`install-local-backup-retention.ps1` registers a checkout-specific current-user task:
daily 09:00 local time and at user logon, with StartWhenAvailable and no overlapping
runs. DPAPI needs the originating profile, so signed-out/offline time is reconciled
when that user next logs in. On this device the installed task is
`Jahan-Develop-BackupRetention-59270257A7EC`; a real scheduled run returned 0.
Only the protected daily outbox is in scope; the two encrypted manual Redis/database
recovery archives remain preserved. No Google data or existing recovery archive was
deleted by this change.

## Independent remote retention operations

Media cleanup and Google Sheets reconciliation have independent transactions and
failure handling. Each is attempted even if the other fails; successful work commits,
failed work rolls back, and all errors are reported through an ExceptionGroup.
Failure is never converted into a successful maintenance marker. The existing
standalone media-cleanup production cron remains available as an additional safeguard.

## Public CSP

Public HTML now uses a cryptographically random per-request nonce and strict-dynamic,
with no unsafe-inline in script-src. The existing admin policy remains strict.
The public document reads its server-generated nonce from request headers; a React
context carries it to JSON-LD and the analytics Script component, including components
used by client-rendered destination pages. Framework/hydration scripts receive the
nonce through Next.js's built-in CSP integration. No attacker-supplied nonce header is
trusted: the proxy overwrites it. Public maps and analytics origin restrictions remain.

Nonce-bearing pages now render per request and use no-store HTML, rather than static
HTML/shared caching. This is the material performance tradeoff. Fingerprinted static
asset caching, home-page content/layout and form interactions are preserved. The
webpack build and 108-route regression checked output and JavaScript budgets.

## Local validation

- 243 backend unit/architecture/contract cases passed. Seven affected unit cases
  also passed after the final SMTP test additions. Ruff formatting/lint and mypy
  (218 source files) passed.
- 58 unique integration cases passed across the full run and targeted corrected/new
  runs, using disposable PostgreSQL, Redis and real MinIO. The first full run had
  56 passes and one new-test failure caused by a missing CSRF header; the corrected
  session test and affected auth/notification tests passed. An additional real
  loopback SMTP test passed with synthetic users and a disposable in-memory server.
- Queue tests cover SMTP disabled, failed delivery with redacted errors, recovery
  with a new dispatcher/session, and no retry of sent rows. The real authentication
  lifecycle asserts failure/lockout/reset audit events and queued notices.
- All 218 frontend Node tests passed; webpack build and TypeScript checks passed.
- 28 existing Edge browser cases passed, including both public locales and all
  main public sections, panel MFA/step-up, uploads and recovery. Two new CSP cases
  passed with parser-inserted untrusted HTML: injected scripts were blocked, valid
  script nonces matched, successive requests had different nonces, and navigation
  remained interactive. The original DevTools-evaluation probe was replaced because
  it did not model an untrusted HTML injection.
- The public route/asset audit passed 108 routes with no failures or JS budget
  failures. Largest destination gzip JavaScript was 224,695 bytes, below 240,000.
- Seven real Windows DPAPI checks passed, including independent expiry without an
  export. Both current-user scheduled tasks reported last result 0.
- Production release shell syntax was checked in an isolated read-only Linux
  container; no release commands were executed.

Existing dependency deprecation/module-type warnings remain. Production service
configuration, external SMTP delivery and real Google behavior were not exercised.

Implementation: identity panel/service/repository/dependency/mailer plus the new
security_notifications module; operational maintenance/tasks and Celery schedule;
production release cron source; local cleanup/dispatcher/install scripts. Frontend:
proxy/Next headers, public document/nonce context, JSON-LD, analytics and the global
not-found wrapper. Home-page route changes only replace its JSON-LD script wrapper.
Tests and GOOGLE_SHEETS_BACKUP.md accompany these changes.
