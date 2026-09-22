# Database Migrations

The canonical migration chain is Alembic under `backend/alembic/versions`. Each revision executes a reviewable PostgreSQL up/down file under `database/sql`.

## Order

1. `001_create_identity_access`
2. `002_create_catalog_media`
3. `003_create_content_and_crm`
4. `004_create_applications_documents`
5. `005_create_learning`
6. `006_create_commerce`
7. `007_create_communications_integrations`

## Local execution

```powershell
docker compose -f database/compose.yml up -d
$env:DATABASE_URL = "postgresql+psycopg://jahan:jahan_local@localhost:55432/jahan_academy"
Set-Location backend
python -m alembic -c alembic.ini upgrade head
python -m alembic -c alembic.ini current
python -m alembic -c alembic.ini downgrade base
python -m alembic -c alembic.ini upgrade head
```

For a disposable syntax/integrity check, SQL files can also be applied with `psql -v ON_ERROR_STOP=1` in numeric order. Production migrations must run through one controlled migration job, never from every API replica.

These migrations establish the approved baseline domains. Conditional entities such as wallet and identity-verification provider workflows require a later approved migration rather than speculative columns in the baseline.
