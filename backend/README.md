# Jahan Academy Backend

FastAPI domain-oriented modular monolith on Python 3.12.

## Commands

```powershell
uv sync --frozen --dev
uv run uvicorn app.main:app --reload
uv run pytest
uv run ruff check .
uv run mypy app
uv run alembic -c alembic.ini upgrade head
```

Copy `.env.example` to `.env` for local values. Business code belongs to `app/modules/<domain>`; cross-cutting infrastructure belongs to `app/core`; HTTP composition belongs to `app/api`; small stable primitives belong to `app/shared`.

Build the production image from the repository root so migration SQL is available:

```powershell
docker build -f backend/Dockerfile -t jahan-academy-backend .
```

The full module rules and request/data flows are documented in `../BACKEND_ARCHITECTURE.md`.
API behavior is contract-first: read `../API_DESIGN.md` and validate `openapi/api-v1.yaml` before
implementing or changing a route.

Implemented public authentication routes are under `/api/v1/auth`: register, email verification,
login, refresh, logout, password-reset request and password reset. The local SMTP defaults target a
mail-capture service at `localhost:1025`; production must provide real SMTP settings and a strong
`JAHAN_SESSION_SECRET`.

Reference-data APIs are implemented under `/api/v1/reference-data/{kind}` for localized public
reads and `/api/v1/admin/reference-data/{kind}` for permission-protected management. Supported
kinds are countries, cities, academic levels, fields of study, intakes, and currencies. Admin writes
require complete Persian and English translations and the `reference_data.write` permission;
deletion archives/deactivates records and produces an audit entry.

Public consultation requests are accepted at `POST /api/v1/consultation-requests`. The endpoint
normalizes Iranian and international mobile numbers, requires privacy and contact consent, returns
a public `JA-...` tracking code, and reuses that code for equivalent requests received within 24
hours. Lead persistence, initial status history, and the pending Noura outbox/sync records commit in
one database transaction. Clients may send a 16–128 character `Idempotency-Key` when retrying the
same request.

Lead-management APIs are available under `/api/v1/admin/leads`. Staff with `lead.read.all` can
search and filter every lead; callers with only `lead.read.assigned` are scoped to their own current
assignments inside the SQL query. Detail responses include an ETag. Partial edits and Archive
require `lead.write.all` plus a matching `If-Match`; Archive requires a reason and never permanently
deletes the lead. Mutations write PII-safe audit evidence.

Lead workflow operations are available at `POST /api/v1/admin/leads/{id}/assignments`,
`POST /api/v1/admin/leads/{id}/status-transitions`, and `GET /api/v1/admin/leads/{id}/history`.
Assignment validates an active Consultant role, preserves transfers, and advances a new lead to
`assigned`. Status transitions follow the documented state matrix; Consultants can mutate only
their current assignments, while Support and Super Admin can act across all leads.
