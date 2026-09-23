"""Add durable Noura mock integration and retry state."""

from migration_sql_runner import execute_sql_file

revision = "013_noura_mock"
down_revision = "012_lead_workflow"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("013_create_noura_mock_integration.up.sql")


def downgrade() -> None:
    execute_sql_file("013_create_noura_mock_integration.down.sql")
