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
