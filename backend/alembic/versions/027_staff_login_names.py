"""Add explicit, unique staff login names."""

from migration_sql_runner import execute_sql_file

revision = "027_staff_login_names"
down_revision = "026_call_statuses"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("027_staff_login_names.up.sql")


def downgrade() -> None:
    execute_sql_file("027_staff_login_names.down.sql")
