"""Create temporary admin dashboard reporting permission."""

from migration_sql_runner import execute_sql_file

revision = "023_admin_dashboard_reporting"
down_revision = "022_audit_log"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("023_create_admin_dashboard_reporting.up.sql")


def downgrade() -> None:
    execute_sql_file("023_create_admin_dashboard_reporting.down.sql")
