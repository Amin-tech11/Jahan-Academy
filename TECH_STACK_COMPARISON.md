# Jahan Academy — Final Stack Comparison

**Decision date:** 2026-09-22
**Comparison basis:** Complete target product, not only MVP delivery

## 1. Executive Decision

For the final Jahan Academy product, the previous project's broad architecture is the better starting point: Next.js for the frontend, FastAPI for the backend, PostgreSQL, SQLAlchemy, Alembic, Python media/document tooling, Docker, and Caddy.

The earlier Jahan Academy proposal used Next.js as both frontend and backend with Prisma and a PostgreSQL-only worker. That was simpler for a small web-first MVP, but it is no longer the selected architecture. The full product requires public accounts, applications, private documents, payments, LMS workflows, notifications, scheduled work, mobile readiness, and multiple external integrations. Those requirements justify a stable independent API and a general background-processing platform.

The final decision therefore **adopts and modernizes the previous stack instead of replacing it**.

## 2. Stacks Being Compared

### 2.1 Previous website stack supplied by the owner

- Next.js 16, React 19, TypeScript, HTML/CSS, Tailwind CSS 4.
- Python 3.12 with FastAPI.
- PostgreSQL 17.
- SQLAlchemy and Alembic.
- OpenPyXL, ReportLab, and Pillow.
- Vazirmatn.
- Docker and Docker Compose.
- Caddy and Nginx.
- pnpm.

### 2.2 Final Jahan Academy stack

- Next.js 16.3.3+ patched 16.x, React, strict TypeScript, Tailwind 4.3+, Radix UI, `next-intl`, and Vazirmatn.
- Python 3.12 (feature version frozen) with FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, and asyncpg.
- PostgreSQL 18.
- Redis 8, Celery 5.6, Celery Beat, and a PostgreSQL transactional outbox.
- S3-compatible object storage and CDN.
- Pillow, OpenPyXL, WeasyPrint, FFmpeg, and ClamAV.
- OpenAPI-generated TypeScript client.
- Docker/Compose, Caddy or managed ingress, GitHub Actions.
- OpenTelemetry, Sentry, Prometheus/Grafana, structured logging.
- pnpm for frontend and uv for Python.

## 3. Layer-by-Layer Comparison

| Layer | Previous website | Final Jahan Academy | Decision and reason |
|---|---|---|---|
| Frontend | Next.js 16, React 19, TypeScript | Patched Next.js 16.x, React, strict TypeScript | Keep and harden; excellent SEO, SSR, routing, and frontend developer experience |
| Styling | Tailwind 4, HTML/CSS | Tailwind 4.3+, Radix UI, owned design system | Keep Tailwind and add accessible primitives/tokens for a large bilingual UI |
| Localization | Not specified | `next-intl`, `/fa` and `/en`, RTL/LTR rules | Add; bilingual routing and SEO are core product requirements |
| Backend | Python 3.12 + FastAPI | Python 3.12 + FastAPI | Keep both architecture and runtime feature version; freeze `>=3.12,<3.13` to maximize dependency maturity and avoid a mid-project migration |
| Validation | FastAPI default/unspecified | Pydantic v2 with separate API schemas | Make explicit; prevents persistence models becoming public contracts |
| Database | PostgreSQL 17 | PostgreSQL 18 | Upgrade for a new project and longer support horizon; 17 remains an infrastructure fallback if required |
| ORM | SQLAlchemy | SQLAlchemy 2 | Keep; strong transaction, SQL, relationship, async, and repository support |
| Migrations | Alembic | Alembic | Keep; native migration companion for SQLAlchemy |
| Async driver | Not specified | asyncpg | Add for high-concurrency API I/O where beneficial |
| Cache/session state | Not specified | Redis 8 | Add for sessions, OTP state, rate limits, caching, locks, and Celery transport |
| Jobs | Not specified | Celery + Beat + PostgreSQL outbox | Add; final product needs routing, retries, scheduling, isolation, and atomic event delivery |
| Excel | OpenPyXL | OpenPyXL in workers | Keep; suited to reviewed admin import/export templates |
| PDF | ReportLab | WeasyPrint primary; ReportLab exceptional only | Change; HTML/CSS templates are easier to brand, localize, and visually test for Persian/English invoices and certificates |
| Images | Pillow | Pillow plus Next Image/Sharp | Keep Pillow for trusted ingestion/variants; add optimized web delivery |
| Video | Not specified | FFmpeg worker | Add for LMS thumbnails, metadata, and streaming renditions |
| File security | Not specified | ClamAV + private object storage + presigned URLs | Add because applicant files are untrusted and sensitive |
| File storage | Local/unspecified | S3-compatible object storage + CDN | Change; local container storage is unsuitable for documents, replicas, and media delivery |
| API contract | FastAPI likely OpenAPI | Versioned OpenAPI 3.1 + generated TS client | Strengthen; eliminates handwritten frontend/backend DTO drift |
| Authentication | Not specified | Backend-owned sessions, Argon2id, OTP adapters, Google OAuth, MFA path | Add; one identity authority supports public users and staff safely |
| Fonts | Vazirmatn | Vazirmatn plus an approved Latin companion/fallback | Keep; exact font tokens remain governed by the design system |
| Containers | Docker/Compose | Docker/Compose | Keep for repeatable development and deployment |
| Reverse proxy | Caddy and Nginx | Caddy **or** managed ingress | Simplify; Caddy already handles reverse proxy and automatic TLS, so running Nginx in the same role adds no default value |
| Observability | Not specified | OpenTelemetry, Sentry, Prometheus/Grafana, structured logs | Add; multiple deployables and business-critical jobs require traceability |
| Frontend packages | pnpm | pnpm/Corepack | Keep; fast deterministic workspace management |
| Python packages | pip/unspecified | uv + `pyproject.toml` + `uv.lock` | Add; fast, reproducible Python environments and a committed universal lockfile |
| Testing | Not specified | pytest, Testcontainers, Vitest, Testing Library, Playwright, axe, load tests | Add; the product has role, payment, document, localization, and integration risk |

## 4. Why FastAPI Wins for the Final Product

The former Next.js-only backend proposal optimized for one developer delivering a content and lead-generation MVP. For the complete target product, FastAPI has concrete advantages:

1. **Independent API boundary:** Web, future mobile clients, Noura, payment callbacks, and partners use one contract.
2. **Automatic contract generation:** OpenAPI and Pydantic schemas generate a typed frontend client and support contract testing.
3. **Python ecosystem:** document processing, spreadsheet imports, data enrichment, reporting, media orchestration, and possible recommendation features stay in one backend language.
4. **Long-running workflow separation:** API and Celery workers share domain code without forcing job logic into a web framework.
5. **Security ownership:** authentication, authorization, consent, document access, and audit policy live in one backend.
6. **Scalability:** Next.js Web, API replicas, and worker queues scale independently.

This does not mean FastAPI is categorically better than a Next.js backend. It is better for the **approved final scope**.

## 5. Why the Previous Stack Is Not Copied Unchanged

### 5.1 Python 3.12 is retained and frozen

The complete dependency audit did not satisfy the requirement that every selected library officially support Python 3.14. Most core packages do, but stable Celery 5.6.3 publishes official classifiers only through Python 3.13, while OpenPyXL 3.1.5 does not publish a Python 3.14 classifier. Running or installing a package on a runtime is not equivalent to an officially supported production combination.

The final backend therefore retains Python 3.12 and declares `requires-python = ">=3.12,<3.13"`. Patch releases within Python 3.12 remain allowed for security and bug fixes. A feature-version migration requires explicit Product Owner approval, an ADR, a complete compatibility audit, lockfile regeneration, rebuilt images, and full regression/load testing.

### 5.2 PostgreSQL 17 to 18

PostgreSQL 17 remains capable and supported. PostgreSQL 18 is selected for a new system because it has the longer remaining support horizon. The application avoids gratuitous version-specific coupling so a managed PostgreSQL 17 fallback remains possible after compatibility testing.

### 5.3 Redis and Celery are added

Noura sync alone could be handled by a PostgreSQL worker. The final platform also needs notifications, OTP, imports, document scans, PDF generation, payment reconciliation, LMS video processing, search indexing, cleanup, and scheduled reminders. Celery provides queue routing, worker concurrency, scheduling, retries, and workload isolation.

The PostgreSQL transactional outbox is retained because Celery publication alone cannot atomically commit a lead/application/payment change and its follow-up job. The two mechanisms solve different problems.

### 5.4 WeasyPrint replaces ReportLab as the primary PDF engine

Jahan Academy's primary PDFs are branded documents such as invoices, certificates, consultation summaries, and application packs. HTML/CSS templates are easier to maintain, preview, localize, and visually verify than manually positioned drawing commands. ReportLab remains allowed only when a low-level PDF primitive is genuinely advantageous.

### 5.5 S3-compatible storage replaces local file persistence

Private applicant documents and LMS media must survive container replacement, support multiple API/worker replicas, use short-lived access, and integrate with a CDN. Local disk remains a development convenience only.

### 5.6 One ingress instead of Caddy plus Nginx

Caddy provides reverse proxying and automated TLS. Nginx is not added unless a future hosting constraint or measured feature requirement specifically justifies it. Fewer proxy layers mean fewer header, upload, timeout, caching, and certificate failure modes.

## 6. What Was Better in the Earlier Next.js-Only Proposal

The discarded proposal still had valid strengths:

- One programming language and fewer deployment units.
- Faster setup for a content/lead-only MVP.
- Shared Zod/TypeScript types without client generation.
- Lower local infrastructure and operational overhead.

Those advantages do not outweigh the complete product's integration, workflow, document, LMS, and multi-client needs. Complexity is controlled by keeping FastAPI as a modular monolith, not by removing the backend boundary.

## 7. Final Decisions

| Concern | Final decision |
|---|---|
| Web | Next.js 16.x, React, TypeScript, Tailwind, Radix, `next-intl` |
| API | FastAPI modular monolith on Python 3.12, feature version frozen |
| Data | PostgreSQL 18 through SQLAlchemy 2 and Alembic |
| Sessions/cache/limits | Redis 8 |
| Jobs | Celery 5.6 + Beat; PostgreSQL outbox for critical events |
| Files | Private S3-compatible storage, scanning, presigned URLs, CDN |
| Processing | Pillow, OpenPyXL, WeasyPrint, FFmpeg, ClamAV |
| Contracts | FastAPI OpenAPI + generated TypeScript client |
| Delivery | Docker/Compose; Caddy or managed ingress; GitHub Actions |
| Observability | OpenTelemetry, Sentry, Prometheus/Grafana, structured logs |
| Architecture | Separate Web/API deployments; backend modular monolith; no early microservices |

## 8. Bottom Line

The previous website stack is **not worse**. Its core separation of Next.js and FastAPI is the better choice for Jahan Academy's final form. The final stack keeps that foundation, upgrades its supported versions, removes the redundant default proxy, and adds the missing operational components required by a production education and application platform.

The detailed implementation rules are authoritative in [TECH_STACK.md](./TECH_STACK.md).

## 9. References

- [FastAPI features](https://fastapi.tiangolo.com/features/)
- [SQLAlchemy 2 documentation](https://docs.sqlalchemy.org/en/20/)
- [Alembic documentation](https://alembic.sqlalchemy.org/en/latest/)
- [Python downloads](https://www.python.org/downloads/)
- [Celery package metadata and supported Python classifiers](https://pypi.org/project/celery/)
- [OpenPyXL package metadata](https://pypi.org/project/openpyxl/)
- [PostgreSQL versioning policy](https://www.postgresql.org/support/versioning/)
- [Celery documentation](https://docs.celeryq.dev/en/stable/)
- [Redis documentation](https://redis.io/docs/latest/)
- [uv project documentation](https://docs.astral.sh/uv/concepts/projects/)
- [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https)
