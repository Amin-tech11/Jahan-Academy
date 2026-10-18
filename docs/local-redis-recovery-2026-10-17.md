# Local Redis recovery — 2026-10-17

Update 2026-10-18: both archives described below have now been protected with
Windows DPAPI CurrentUser in the develop checkout. Their current paths end in
`.tar.gz.dpapi` and `.dump.dpapi`, respectively. The original plaintext files were
removed only after decrypting the saved ciphertext and matching the SHA-256 values
below. Those hashes identify the **decrypted archive contents**, not ciphertext.
The original paths below document the recovery as performed on October 17.
See [local backup protection and recovery](auth-resource-and-local-backups.md)
before restoring. No database or Redis restore was performed during encryption.

Scope: existing develop checkout, preview http://localhost:5000. No source code,
home-page implementation/assets, branch, port or Redis configuration was changed.
No push, PR, merge, remote CI or production deployment was performed.

## Backup and repair

Stopped the restarting local `jahan-academy-redis-1` before snapshotting its complete
`jahan-academy_redis_data` volume, including RDB, multipart AOF and manifest. Backup:

`.backup-outbox/redis-20261017-repair/redis-before-repair.tar.gz`

SHA-256: `F36B12A761FAAE61479813201811E32B414BB52A3B9DB2C858CC510227B74946`

The gzip/tar archive was read through and its members listed before repair. It remains
local and Git-ignored. Redis 8.4.0's own `redis-check-aof` confirmed that the base RDB
checksum was valid and that the incremental AOF's final 73 bytes were invalid. With
the backup retained, `--fix` truncated only that tail: 43,882,951 → 43,882,878 bytes.
The removed bytes are preserved in the backup; their intended final operation cannot
be reconstructed from the truncated tail. A subsequent complete check reported every
AOF file and the manifest valid. No flush, volume replacement or configuration bypass
was used. Redis then started healthy.

## Local preview compatibility

The local API's migration overlay had stopped at `026_call_statuses` (alongside the
existing public-experience CMS head), while develop code already expected the existing
`027_staff_login_names` migration. The first synthetic-account setup rolled back its
transaction when that missing table was encountered; no partial account remained.

Before applying migration 027, captured a PostgreSQL custom-format backup of the same
`jahan_academy` database and checked its archive table of contents:

`.backup-outbox/redis-20261017-repair/database-before-027.dump`

SHA-256: `F640E84B0116974981968845C54C7A4679F3FCFDF107E13EAE53D2D91E2824B0`

Copied the already tracked 027 migration into the ignored local API migration overlay
and applied only that revision. The CMS migration head and existing account data were
preserved. No new migration was authored and no existing user's credentials or MFA
were modified.

## Real verification

Ran headless Edge against port 5000 with a temporary synthetic local administrator.
No API interception, mock responses, or test dependency overrides were used.

- Password login returned 200 and showed the mandatory MFA enrollment gate.
- Real MFA setup and TOTP confirmation returned 200 and revoked earlier sessions.
- Password-only login then returned 401 with MFA required.
- Login with an issued one-use recovery code returned 200; protected panel-access and
  profile requests returned 200.
- Reload rotated the refresh token successfully (200); the new access token reached
  the authenticated profile. An initial test mistakenly reused the pre-rotation token
  and correctly got 401; the corrected complete scenario passed.
- Logout returned 204; the just-revoked access token was rejected with 401.
- The home page loaded and refreshed on port 5000 with its expected single heading.
- The temporary account and related database records were removed in a finally block.
  No screenshots, session traces or real user credentials were captured.

Finally wrote a unique expiring Redis probe, restarted the repaired service, verified
that the value survived AOF reload, then deleted the probe. Redis reported running,
healthy and no crash restarts. API `/health/ready` returned 200 with both database and
Redis checks true. The tracked working tree was clean before recording this report.

This was an operational recovery, so a new application unit-test suite or frontend
build was unnecessary; the existing application code and build were unchanged.
