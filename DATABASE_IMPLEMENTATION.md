# Jahan Academy — Database Implementation Baseline

**Status:** Implemented and tested
**Database:** PostgreSQL 18
**Migration engine:** Alembic on Python 3.12
**Head revision:** `014_media_management`

## Migration Chain

| Revision | SQL migration | Scope |
|---|---|---|
| `001_identity_access` | `001_create_identity_access` | Users, profiles, identities, RBAC, sessions, challenges, consent, privacy |
| `002_catalog_media` | `002_create_catalog_media` | Countries, cities, media, universities, academic taxonomy, Programs, intakes |
| `003_content_crm` | `003_create_content_and_crm` | Articles, FAQs, services, campaigns, leads, assignments, consultation |
| `004_app_docs` | `004_create_applications_documents` | Documents, applicant profile records, applications, tasks, requirements, submissions |
| `005_learning` | `005_create_learning` | Courses, instructors, curriculum, enrolment, progress, quizzes, reviews |
| `006_commerce` | `006_create_commerce` | Products, prices, orders, items, payments, events, refunds, invoices |
| `007_comms_integrations` | `007_create_communications_integrations` | Conversations, tickets, notifications, outbox, sync, webhooks, audit |
| `008_harden_auth` | `008_harden_authentication` | Login lockout state and rotating refresh-token session families |
| `009_reference_data` | `009_create_reference_data_management` | Bilingual reference-data lifecycle, currencies, seed data, permissions, and indexes |
| `010_consultation_submission` | `010_create_consultation_submission` | Consultation deduplication state, optional gender description, and immutable submission-event history |
| `011_lead_management` | `011_create_lead_management` | Lead row versions, durable archive evidence, list index, and canonical lead-management permissions |
| `012_lead_workflow` | `012_create_lead_assignment_status_workflow` | Assignment/transfer evidence, workflow permissions, and assignment timeline index |
| `013_noura_mock` | `013_create_noura_mock_integration` | Noura idempotency state, manual-retry evidence, reclaimable outbox index, and retry permission |
| `014_media_management` | `014_create_media_management` | Media upload lifecycle, purpose/status validation, checksum deduplication, optimistic concurrency, and media permissions |

Each Alembic revision executes a paired, reviewable `.up.sql` and `.down.sql` file. SQL is split into individual statements by the migration runner, while Alembic keeps one transaction per revision on PostgreSQL.

## Locations

- Alembic configuration: `backend/alembic.ini`
- Alembic environment: `backend/alembic/env.py`
- Revisions: `backend/alembic/versions/`
- SQL runner: `backend/migration_sql_runner.py`
- Up/down SQL: `database/sql/`
- PostgreSQL test environment: `database/compose.yml`
- Smoke test: `database/sql/schema_smoke_test.sql`

## Verification Performed

The baseline was tested against the official `postgres:18-alpine` image:

1. Applied all fourteen raw up migrations with `ON_ERROR_STOP=1`.
2. Confirmed 111 application tables in the `public` schema.
3. Ran required-table checks for identity, catalog/reference data, lead, application, document, LMS, commerce, support, notification, outbox, and audit domains.
4. Verified representative `CHECK` and foreign-key violations are rejected.
5. Applied every down migration in reverse order.
6. Confirmed the `public` schema returned to zero application tables.
7. Re-applied all migrations successfully.
8. Compiled Alembic code under Python 3.12.
9. Ran Alembic `upgrade head → current → downgrade base → upgrade head` against a separate PostgreSQL database.
10. Confirmed final Alembic revision `014_media_management` and 111 public tables on PostgreSQL 18;
    latest-revision rollback/re-upgrade remains a required CI gate.

## Implementation Rules

- Production migrations run in one controlled pre-deploy job, never from every API replica.
- A migration is immutable after it has reached a shared environment; corrections use a new revision.
- Destructive production changes use expand/migrate/contract migrations and verified backups.
- All business tables use UUID primary keys; current SQL defaults to PostgreSQL `gen_random_uuid()`.
- Business timestamps use `timestamptz` and are stored in UTC.
- Money uses integer minor units plus ISO currency codes.
- Stable machine states use English `varchar` values with `CHECK` constraints rather than PostgreSQL enum types.
- Provider payloads stored as JSONB must be redacted/safe; secrets and raw sensitive payloads are prohibited.
- Soft deletion is used where business/audit history must survive; dependent content uses explicit FK delete rules.
- Runtime database credentials must not own the schema or have migration privileges.

## Deferred Revisions

The baseline intentionally excludes conditional features that are not yet approved as implementation commitments:

- Wallet and wallet ledger.
- Automated identity-verification provider workflow.
- Scholarship management.
- Advanced course assignments/certificates/attendance beyond the current learning baseline.
- Coupons and installment plans.
- Institution/partner portal tenancy.
- OpenSearch index storage and analytics warehouse models.

These require additive numbered revisions after their requirements and ERD boundaries are approved.
