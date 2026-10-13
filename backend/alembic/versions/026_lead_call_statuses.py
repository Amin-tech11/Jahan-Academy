"""Add initial-contact and unanswered consultation statuses."""

from migration_sql_runner import execute_sql_file

revision = "026_call_statuses"
down_revision = "025_mfa"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("026_lead_call_statuses.up.sql")


def downgrade() -> None:
    execute_sql_file("026_lead_call_statuses.down.sql")
