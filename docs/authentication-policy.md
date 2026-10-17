# Authentication abuse and password policy

All POST authentication endpoints except logout use atomic Redis counters, independent
of the general API limiter. Requests are counted before password hashing or email work.
Only a trusted proxy may supply the client address; identifiers are normalized and all
Redis keys use a keyed HMAC. Passwords, email addresses and raw refresh tokens are never
stored in limiter keys. Limits apply across workers and application restarts.

Default fixed window: 900 seconds. Per operation: 30 requests per IP and 10 per
identifier. Registration permits 3 per identifier. Reset and verification email requests
share a combined limit of 3 per email. MFA mutations share a per-user group. Refresh
permits 120 per IP and 60 per token, with an additional stable user-account limit of 60
to prevent bypass by rotation. Login has a stable account limit of 10 to cover aliases.
Successful login does not reset request counters. Excess requests return 429 and the
remaining window in Retry-After. Redis failure returns 503, never unlimited access.
Environment settings are listed in .env.example. CI raises only shared-IP limits for
the integration runner; dedicated tests exercise low limits using actual Redis.

Five incorrect passwords or MFA proofs within 15 minutes lock the account for 15 minutes.
Repeated lockouts within 24 hours double the delay up to 24 hours. Expired failure windows
start over. Active lock deadlines persist in PostgreSQL; failure windows and escalation
history live in Redis, so Redis data loss resets that history. Redis must be private and
persistent in deployment. Successful login or password reset clears failure history.
Locked login uses the same invalid-credentials response as a bad password. There is no
automatic password rotation and no new database migration.

New registration and password reset require 15–128 Unicode code points. Spaces and
non-Latin characters are accepted; no composition rules, trimming or truncation apply.
Existing passwords remain valid for login. Argon2id storage is unchanged. A local list
of 10,001 common passwords plus five predictable examples is checked case-insensitively
using SHA-256 hashes. This finite list is not a complete breached-password database.
It makes no outbound password requests. Its immutable SecLists source revision, source
digest and transformation are in app/modules/identity/password_blocklist.json; the
adjacent LICENSE contains the upstream MIT license. To update, use a reviewed immutable
upstream revision, recompute the source digest and all Unicode-casefolded hashes, retain
the supplemental entries and license, and run password-policy tests. An unreadable or
malformed list fails closed for new passwords. Frontend length checks use code points
as well, allow paste/password managers, and display the server's common-password error.

## Local verification (2026-10-17)

- Backend unit, architecture and contract suite: 186 passed; mypy and Ruff passed.
- Integration: 45 distinct tests passed against disposable PostgreSQL and Redis
  (44 in the complete run, then the four focused limiter tests including one added test).
- Frontend Node suite: 212 passed; TypeScript and production build passed.
- Browser on develop port 5000: eight passed, covering MFA gating, recovery, throttling,
  Unicode passwords, and Persian/English home accessibility, hydration and metadata.
- Disposable test services were removed. No schema migration or production operation
  was needed. Push, remote CI, PR creation, merge and deployment were deliberately skipped.
- Final live preview check: the home page returned 200, but the local API returned 503.
  The existing shared jahan-academy-redis-1 is restarting because its incremental AOF has
  a bad file format (confirmed in container logs). Its data/configuration were left intact.
  Integration tests used isolated healthy services; auth browser tests mocked API responses.
  Live preview authentication therefore remains blocked by this separate Redis problem.

Changed areas: backend identity abuse control, service/repository/dependencies/router,
password validation/schemas and bundled blocklist/license; core settings and example
environment; CI integration IP allowance; frontend login/recovery/MFA password fields,
request error messages and shared password helper; focused backend/frontend/browser
tests and this document. Home-page implementation and assets were unchanged.
