# Human activity and sensitive-operation confirmation

Develop preview: port 5000. No new schema migration is required. Home-page code and
assets are outside this change.

## Idle activity

Authenticated reads and background refresh validate the persisted idle deadline but
never extend it. A rotated session inherits the parent's `last_seen_at`, while the
original family creation time still controls the absolute deadline. Expired sessions
cannot be rescued by an activity POST or refresh.

The panel sends `POST /api/v1/auth/activity` only after trusted pointer, keyboard,
wheel or touch input in a visible document, at most once per minute. There is no
activity heartbeat, and no activity tracking for MFA-enrollment-only sessions. The
endpoint requires a valid non-expired authenticated session and CSRF protection.
Logout removes the input listeners. Active input may refresh an expired access token
only while the server-side session is still valid. Browser events do not prove human
presence cryptographically; this separates ordinary background work from user input.

## Step-up authorization

All five staff mutation routes require a fresh proof: account creation/update, role
replacement, access recovery and panel-access replacement. Existing role and section
authorization checks remain in place. Reads do not prompt.

The pending mutation receives `REAUTH_REQUIRED` before its service runs. A modal asks
for the current password and an enrolled TOTP or unused recovery code. The proof
endpoint requires authentication and CSRF, shares the existing failure/lockout system
and has its own per-IP and per-user request window. Successful confirmation is audited.
No administrator's existing password, MFA or account configuration is changed.

The returned random proof is held in memory, stored only as a hash-keyed Redis entry,
expires after five minutes, and is bound to the user, exact session, HTTP method and
target path. Atomic compare-and-delete allows exactly one consumption. Other sessions,
other targets, missing/expired/replayed proofs and Redis outages cannot authorize the
mutation. Refresh changes the session binding, so an old proof cannot cross rotation.
The browser forwards the proof through the existing BFF and retries only the pending
mutation once, preserving its payload and If-Match version. Cancellation does not retry.

The explicit `.ts` imports and TypeScript `allowImportingTsExtensions` option support
the project's native Node TypeScript test runner; Next continues to build normally.

## Verification

The new integration suite exercises the real session, database, Redis and auth/CSRF
dependencies with disposable services. It covers passive polling, explicit activity,
refresh inheritance, idle expiry, wrong password/MFA, target/session binding, replay,
concurrent consumption and TTL expiry. Unit tests check that every staff mutation is
protected and Redis failure denies access. Frontend tests cover input-event throttling,
exact retry, cancellation and the modal flow. Two older lifecycle suites explicitly
mock the step-up dependency to retain their existing lifecycle/permission focus; the
new security suite does not mock that dependency.

No push, PR, merge or deployment is part of this task; remote CI is not run.

Local results (2026-10-17): 191 backend unit/architecture/contract tests passed;
47 distinct integration tests passed (46 in the complete run, then the two focused
session-security tests including the newly added concurrency/TTL case). All 215 Node
frontend tests passed; the final API/activity subset was rechecked after disabling
activity tracking during MFA enrollment. TypeScript, Next production build, mypy over
app/tests, Ruff lint and Ruff format checks passed.

Ten browser tests passed on port 5000: mandatory MFA gating, step-up confirmation and
cancellation, password recovery/policy, and Persian/English home accessibility,
hydration and metadata. These UI tests mock API responses. Separately, a real headless
Edge session through the live port-5000 BFF, local API, database and repaired Redis
verified password login/MFA enrollment, rejection without step-up, a successful sensitive
change after password plus recovery-code confirmation, rejection of proof replay,
working refresh for an active session, rejection after setting only the synthetic
account's activity 16 minutes in the past, and a home-page refresh. The temporary
account and related records were removed in a finally block. No production data,
existing administrator credentials, screenshots or credential-bearing traces were used.

Changed areas: backend identity service/router/schemas/dependencies and abuse limits,
new Redis proof helper; frontend administrative BFF, layout/modal, in-memory API client,
activity and step-up helpers, TypeScript import configuration; focused tests, the
existing session-expiry assertions and test staff helper; this document and the
authentication policy. There are no home-page implementation or asset changes.
