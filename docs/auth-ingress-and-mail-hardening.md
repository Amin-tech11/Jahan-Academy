# Develop authentication ingress and delivery hardening

Scope: three findings from the review at fc5f420. Develop remains on localhost:5000.
Home content, CSS, assets and the independent public-experience migration head are
preserved. No push, merge, PR or production release.

## Request admission

Admin BFF writes are admitted before reading/parsing the body. Each process caps
concurrent writes at 8, total writes at 300/minute and each trusted client at
60/minute. Only authenticated internal proxy IP headers are trusted; requests
without them share a fallback bucket. GET polling is excluded. Expiring counters
are bounded and contain no request bodies. Backend Redis limits remain in place.

Auth bodies are capped at 16 KiB; other admin JSON bodies retain a 2 MiB cap.
Actual streamed bytes are counted regardless of Content-Length. Reading has a
5-second deadline, cancels rejected streams and returns 413/408/400 as appropriate.
Rejected admission returns 429 with Retry-After. Production Nginx's cap is unchanged.

## Durable authentication mail

Migration 029 adds private auth_mail_outbox, separate from user-facing notifications.
Reset and verification tokens use Fernet with a domain-separated key derived from
the configured MFA encryption key (or local session key). Plain tokens and recipient
addresses are not stored in queue metadata/logs. Queue and account/token changes
commit together. Replacement requests erase the earlier queued secret. The existing
minute security-notification worker also drains this queue. Public recovery and
staff creation/recovery acknowledge acceptance, rather than claiming SMTP success.

Batches select 20 due rows with SKIP LOCKED. SMTP failure retains encrypted content
and retries after a minute until token expiration. Used, superseded, deleted-account
and expired tokens are removed without sending. Successful delivery erases ciphertext.
A crash after SMTP acceptance but before commit may duplicate delivery (at-least-once).
Drain pending mail before encryption-key rotation; otherwise old tokens fail closed
and a new request is needed. A functioning SMTP provider and running dispatcher are
still required. No external email was sent in this task.

## Registration privacy

New and existing email registrations return identical 202 envelopes. Both run the
same password policy and bounded hashing. Verification SMTP is deferred, removing
SMTP latency from the response. Duplicate insertion races also return the generic
response. Existing passwords are never replaced. This closes the explicit response
oracle; it does not claim perfect timing indistinguishability under variable load.

## Validation and local runtime

243 backend unit/architecture/contract tests and 222 frontend Node tests passed.
TypeScript, webpack production build, Ruff and backend mypy passed. Initial isolated
PostgreSQL/Redis integration run: 13 passed, including registration/auth/staff flows,
encrypted retry, invalid-token rejection and real loopback SMTP notice delivery.
The five outbox integration cases passed on the final targeted run, including
atomic rollback and concurrent dispatch (14 unique integration cases across runs).
All 29 selected Edge browser cases passed on port 5000, covering both public locales,
CSP, MFA, step-up, recovery and consultation behavior. Mypy checked 220 source files.

Live oversized auth input returned 413/no-store. Local admin/fa/en and API readiness
returned 200. Queue dry-run showed zero pending. The local DB has an independent
public-experience migration head: ambiguous head failed without mutation, then
explicit upgrade to 029_auth_mail_outbox succeeded, preserving the other head.
Only the develop API and preview were restarted; no production changes were made.
