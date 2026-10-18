# Upload reservations and Google Sheets retention — 2026-10-18

Target: develop and localhost:5000. Home-page code/assets are unchanged. No push,
merge, remote CI or deployment is performed. Migration 028 is additive.

## Upload quotas

Each intent reserves capacity under a PostgreSQL transaction advisory lock shared by
all API processes. The reservation and intent commit together. Defaults:

| Setting | Default |
| --- | --- |
| JAHAN_MEDIA_USER_QUOTA_BYTES | 512 MiB |
| JAHAN_MEDIA_TOTAL_QUOTA_BYTES | 5 GiB |
| JAHAN_MEDIA_USER_PENDING_LIMIT | 20 |
| JAHAN_MEDIA_TOTAL_PENDING_LIMIT | 200 |

An uncleared quarantine reservation counts **twice** its declared size, covering both
quarantine/replay and public promotion at once. After cleanup, an undeleted ready
asset counts once. Rejected/deleted intents keep their reservation until cleanup;
deleting a database-visible asset cannot free capacity while its presign is reusable.
Pending counts include ready assets whose original quarantine URL has not yet expired.
Limits are conservative logical byte budgets, not filesystem free-space guarantees.
Existing data above a configured quota is retained; further reservations return 429
MEDIA_QUOTA_EXCEEDED until capacity is available. Super administrators also obey limits.

Signed POST expiry is capped to the recorded intent deadline inside the signing
worker. Waiting on locks or the thread pool cannot extend a link past its database
deadline. Per-file size/type/key enforcement and bounded inspection remain intact.

## Abandoned upload cleanup

Migration 028 retains the quarantine key and cleanup deadline independently of the
ready/public key. It backfills managed legacy rows (including the application's UTC
month/key layout for already-promoted rows); unrelated media with no upload purpose
is not swept. Imported/untracked objects need a separate reviewed inventory.

Cleanup waits until the original upload deadline plus five minutes, even for rejected
or already-promoted files. It deletes the quarantine object and, for non-ready assets,
any deterministic public key left by a failed promotion transaction. It never deletes
a ready public asset. Row locks with SKIP LOCKED avoid racing active confirmation or
other cleanup workers. Capacity is released only after storage deletion succeeds and
the database transaction commits. Missing objects are safe to retry; storage errors
retain the reservation. Bound batches avoid an unbounded transaction.

Commands (from backend):

```
python -m app.modules.media.cleanup          # count-only dry run
python -m app.modules.media.cleanup --apply  # delete eligible objects
```

Daily maintenance also invokes cleanup. The release template schedules its standalone
command every ten minutes, independent of optional Celery workers. This schedule is
prepared in source only; production cron was not installed or changed. Availability
of capacity depends on successful scheduled cleanup; a failed sweep must be retried.

## Google Sheets

JAHAN_SHEETS_SNAPSHOT_RETENTION_DAYS defaults to 14 and may only be shortened (1–14).
Expired days cannot be recreated through automatic backup or connector preparation.
Reconciliation deletes expired application-owned tabs and removes entire rows whose
public reference maps to an anonymized local lead. It reads reference column A in
bounded chunks, removes rows bottom-up, and verifies remote readback. The persistent
anonymized lead/reference acts as the retry source after local anonymization commits;
Google failure never makes that work disappear. Restarts and lost responses are safe
to reconcile again. A shared PostgreSQL advisory lock serializes backup/reconciliation.

Only exact application title/date plus deterministic sheet-ID pairs are managed.
Unrelated/manual tabs are preserved. If every tab expires, an empty status tab is
created before deleting old tabs because Sheets requires a remaining sheet.
No archived active lead is removed merely because it was archived. Existing daily
export formatting and text-safe cells are retained.

Reconciliation runs before automatic backup and after local retention in both the CLI
and Celery maintenance path. It can still clean existing snapshots when backup has
been disabled but service-account credentials remain available. Without configured
credentials it reports `not_configured`; configured authentication/permission/API or
readback failures propagate and prevent a successful maintenance completion marker.
Dry-run maintenance does not authenticate or modify Google.

**Scope limit:** deleting live tabs/rows does not purge Google revision history,
administrator retention/Vault, downloaded exports or independently copied spreadsheets.
Those require a separately governed Workspace retention/deletion process. This code
does not claim that all historical copies in Google's systems have been erased.
No Google credentials were used and no real Google data was modified in this task.

## Validation and local runtime

Tests use disposable PostgreSQL, Redis and real MinIO, synthetic records and a stateful
mock Google HTTP service. They cover concurrent reservations (user/global bytes and
counts), delayed signing, replay-safe cleanup, storage outage/retry, ready-file
preservation, anonymization followed by Google failure/retry, expiry, unrelated tabs,
last-tab replacement, readback failures and idempotent reruns. No production load test
or live Google permissions/revision-history test is claimed.

Final local suites: 233 backend unit/architecture/contract tests, 55 integration tests,
218 frontend Node tests and nine browser tests passed. Ruff, formatting, mypy,
TypeScript and the production build passed. Migration 028 legacy-key backfill,
downgrade and re-upgrade passed in a separate disposable database. The release script
passed Bash syntax validation in an isolated Linux container. Browser tests exercise
mocked panel API journeys plus both home-page locales on port 5000; they do not claim
a real Google authorization or deletion test.

The local database was backed up before migration 028. The dump is stored encrypted
with Windows DPAPI CurrentUser under the ignored directory
`.operations-hardening/retention-backup-20261018/before-028.dump.dpapi`; decryption was
verified against its original SHA-256 and the plaintext copy removed. Recovery needs
the same Windows user/profile; this local safety snapshot is not an offsite backup.
Only migration 028 was applied to the existing develop database; local data cleanup
was not applied. The dedicated develop API was restarted, and cleanup dry run returned
zero eligible objects. Other panel services and production data were not changed.

API: existing upload-intent response is unchanged; quota errors are 429 with a Persian
panel message. Migration downgrade drops only the new tracking columns/index; it
cannot restore objects that were deleted by an applied sweep.

References: [Sheets batch requests](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/request),
[sheet operations](https://developers.google.com/workspace/sheets/api/samples/sheet).
