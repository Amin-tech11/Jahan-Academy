# Jahan Academy — Backend Architecture

## 1. Decision

The backend is a **domain-oriented modular monolith** built with FastAPI on the
project-frozen Python 3.12 feature version. It is deployed as one API image and one or more
Celery worker processes, while keeping business domains isolated behind explicit interfaces.
This gives the project one transactional boundary and a low operational cost without turning the
codebase into a layer-oriented monolith.

## 2. Directory Structure

```text
backend/
├── app/
│   ├── api/                    # HTTP composition, dependencies and error contract
│   │   └── routes/             # Cross-domain endpoints such as health checks
│   ├── core/                   # Configuration and infrastructure adapters
│   ├── modules/                # Business domains
│   │   ├── identity/           # Users, staff, roles, permissions and authentication
│   │   ├── catalog/            # Countries, universities, programs and intakes
│   │   ├── content/            # Articles, pages, FAQs, SEO and media metadata
│   │   ├── consultations/      # Leads, assignment, status and follow-up
│   │   ├── applicants/         # Applicant profiles, education, language and preferences
│   │   ├── applications/       # Applications, workflow and decisions
│   │   ├── documents/          # Upload metadata, verification and document state
│   │   ├── learning/           # Future courses, lessons, enrolments and progress
│   │   ├── commerce/           # Orders, invoices, payments, refunds and discounts
│   │   ├── communication/      # Tickets, messages and contact history
│   │   ├── notifications/      # Notification preferences and delivery records
│   │   ├── integrations/       # Noura, payment, SMS/email and webhook adapters
│   │   └── reporting/          # Read models, exports and operational metrics
│   ├── shared/                 # Small, stable and domain-neutral primitives
│   ├── workers/                # Celery application and queue-specific tasks
│   └── main.py                 # Application factory and lifecycle
├── alembic/                    # Versioned database migrations
├── tests/
│   ├── architecture/           # Enforced dependency boundaries
│   ├── unit/
│   ├── integration/
│   └── contract/
├── Dockerfile
├── pyproject.toml
└── uv.lock
```

## 3. Module Contract

Each domain may grow the following files only when they are needed:

```text
module/
├── router.py          # FastAPI transport; parsing and response mapping only
├── schemas.py         # Pydantic request/response contracts
├── service.py         # Application use cases and transaction orchestration
├── domain.py          # Domain entities, value objects and invariants
├── policies.py        # Authorization and business-policy checks
├── models.py          # SQLAlchemy persistence models owned by this domain
├── repository.py      # Persistence ports and implementations
├── events.py          # Domain/integration event definitions
└── dependencies.py    # Module-local dependency wiring
```

The `identity` module is the executable reference implementation. Empty capability layers are not
created pre-emptively in every module; they are added with the first real use case.

## 4. Dependency Rules

1. `router` may depend on schemas, dependencies and services in the same module.
2. `service` may depend on domain objects, policies and repository protocols in the same module.
3. Domain code must not depend on FastAPI, Celery or concrete infrastructure clients.
4. A module must not import another module's `models.py` or `repository.py`.
5. Cross-module reads use a public service/query contract; cross-module writes use a public command
   or an integration event.
6. Shared code is accepted only when it is domain-neutral and used by at least two modules.
7. `core` contains infrastructure plumbing, never product business rules.
8. Every permission check is enforced by backend policy; hiding UI controls is not authorization.
9. Authorization combines role permissions, optional resource scopes, and policies owned by the
   relevant domain. The final assignment matrix is maintained in `AUTHORIZATION_DESIGN.md`.

`tests/architecture/test_module_boundaries.py` guards the most important cross-module rule and is
extended as module internals grow.

## 5. Request Flow

```text
Client
  -> FastAPI router
  -> authentication / authorization dependency
  -> Pydantic schema validation
  -> application service
  -> domain policies and invariants
  -> repository
  -> SQLAlchemy transaction
  -> PostgreSQL
  -> response schema
```

Routers do not contain queries or business decisions. Repositories do not decide permissions.
Services define the transaction boundary and return domain/application results rather than HTTP
responses.

## 6. Transactions and Events

- A synchronous use case normally owns one database transaction.
- Multi-table changes and the corresponding outbox event are committed atomically.
- External calls are not made while holding a database transaction open.
- Celery publishes committed outbox records with retries, exponential backoff and idempotency keys.
- Consumers record processed event IDs so retries are safe.
- Noura synchronization state remains separate from the consultation lead lifecycle:
  `pending`, `synced` or `failed`.

## 7. Background Work

Celery workers use the same locked Python 3.12 codebase and separate queues:

| Queue | Responsibility |
|---|---|
| `integration` | Noura sync, outbound webhooks and reconciliation |
| `notification` | Email, SMS and in-app delivery |
| `document` | Virus-scan orchestration, PDF and document processing |
| `media` | Image derivatives and metadata extraction |

Tasks receive identifiers, not large domain payloads. A task reloads current state, checks
idempotency, performs bounded work and records a durable outcome.

## 8. API Conventions

The authoritative endpoint-level contract is `API_DESIGN.md`; its machine-readable baseline is
`backend/openapi/api-v1.yaml`.

- Product endpoints: `/api/v1/...`
- Operational liveness: `/health/live`
- Operational readiness: `/health/ready`
- Page size defaults to 20 and is capped at 100 for authorized internal APIs.
- Errors use a stable envelope with `code`, `message`, `fieldErrors` and `requestId`.
- Public contracts use explicit Pydantic schemas; ORM objects are never returned directly.
- Breaking changes require a new API version or an explicit compatibility migration.

## 9. Configuration and Secrets

Pydantic Settings reads `JAHAN_*` variables. `.env` is allowed for local development only.
Production secrets come from the deployment secret store and must never be logged or committed.
Configuration is validated during process startup so an invalid deployment fails before serving
traffic.

## 10. Security Boundaries

- Admin authentication, session validation and RBAC live in `identity`.
- Passwords use Argon2id. Public-user access tokens are short-lived signed JWTs; opaque refresh
  tokens are stored hashed, rotate after every use, and belong to a revocable session family.
- Email-verification and password-reset secrets are single-use, expiring, and stored only as hashes.
- Rate limits are applied by identity, route sensitivity and caller IP/account.
- File uploads use short-lived presigned URLs, server-side confirmation, type/size validation and
  malware scanning before a document becomes usable.
- Sensitive fields are redacted from structured logs and Sentry events.
- Audit events cover staff authentication, role changes, content changes, lead operations and sync
  actions.

## 11. Test Strategy

| Layer | Purpose |
|---|---|
| Architecture | Prevent forbidden module coupling |
| Unit | Domain invariants, policies and service decisions |
| Integration | Repositories, PostgreSQL, Redis and outbox behavior |
| Contract | OpenAPI/API envelopes and external adapter contracts |
| End-to-end | Critical consultation, content and application workflows |

Required CI gates are Ruff, mypy strict mode, pytest, Alembic upgrade/downgrade verification and
container build. Integration tests use disposable PostgreSQL and Redis instances.

## 12. Extraction Path

A module may become a service only after measured scaling, security or ownership pressure justifies
it. Before extraction, its public interface and owned tables must already be explicit. Integration
events and the outbox become the network boundary; direct cross-database joins are replaced with
read models. No microservice split is planned merely to mirror the module list.

## 13. Adding a Use Case

1. Identify the owning domain and define request/response schemas.
2. Express invariants in domain objects and authorization in policies.
3. add a repository protocol and the smallest persistence implementation required.
4. Orchestrate the transaction in a service.
5. Expose the service through a thin router under `/api/v1`.
6. Add unit, integration and contract tests.
7. Add an Alembic migration when persistence changes.
8. Add an outbox event when another module or external system must react.
