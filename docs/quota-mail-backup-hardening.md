# Quota, email leases and backup deadlines

Scope: develop / localhost:5000. No push, merge, release, production database change, or public/home-page content change.

- BFF admission rejects client/concurrency limits before spending the accepted global request budget. Admitted malformed requests still count. Limits remain per process: 60/client/minute, 300 total/minute, eight concurrent requests.
- Authentication email delivery claims a single encrypted message using a committed two-minute next_attempt_at lease and releases database locks before SMTP. Each send has a 15-second overall deadline. Completion/retry updates require the same row and lease. A crashed worker's lease becomes eligible again; successful sends erase ciphertext. No migration is needed. SMTP delivery remains at-least-once: a crash after remote acceptance but before acknowledgment may cause a retry. Replacement during an in-flight send can still deliver the old link, whose server-side token validation remains authoritative.
- Backup execution has a 30-minute process-group deadline with five-second kill grace. Each offsite transfer has a five-minute deadline within the same outer process group. A complete encrypted local archive is retained before pruning old encrypted backups, and pruning occurs before offsite copying. Nothing is installed on production.

Validation:
- 223 frontend unit tests passed, including noisy-client/global-budget regression.
- 243 backend unit/architecture/contract tests passed.
- 9 isolated PostgreSQL/Redis integration tests passed, including simultaneous workers, blocked SMTP with nonblocking replacement, lease expiry/retry, and complete authentication/staff flows. Initial database startup failures were resolved using a disposable memory-backed database; the successful rerun used no panel data.
- Six Linux backup tests passed with real age encryption; one optional PostgreSQL restore drill was skipped. Deadline tests use stalled synthetic transfer commands that ignore SIGTERM, verify forced termination and reacquire the backup lock. Copy-failure retention also passed.
- Python typing passed for all 220 sources. Ruff and diff whitespace checks passed.

TypeScript and the optimized Next.js build passed. All 29 selected browser regressions passed on localhost:5000 (panel MFA/step-up/password policy and Persian/English public pages). Live smoke checks returned 200 with CSP for /admin, /fa and /en, and 413/no-store for a synthetic oversized login request. External SMTP delivery and production recovery are outside this local test run. CI was not triggered because push is prohibited.
