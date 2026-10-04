"""Persist per-staff panel section access."""

from migration_sql_runner import execute_sql_file

revision = "024_panel_access"
down_revision = "023_admin_dashboard_reporting"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("024_create_panel_access.up.sql")


def downgrade() -> None:
    execute_sql_file("024_create_panel_access.down.sql")
