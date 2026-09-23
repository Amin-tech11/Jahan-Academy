"""Add lead assignment and status workflow support."""

from migration_sql_runner import execute_sql_file

revision = "012_lead_workflow"
down_revision = "011_lead_management"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("012_create_lead_assignment_status_workflow.up.sql")


def downgrade() -> None:
    execute_sql_file("012_create_lead_assignment_status_workflow.down.sql")
