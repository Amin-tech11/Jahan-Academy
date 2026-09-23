"""Add lead-management concurrency, archive evidence, and permissions."""

from migration_sql_runner import execute_sql_file

revision = "011_lead_management"
down_revision = "010_consultation_submission"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("011_create_lead_management.up.sql")


def downgrade() -> None:
    execute_sql_file("011_create_lead_management.down.sql")
