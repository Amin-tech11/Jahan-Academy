"""Finalize the approved administrative Role → Permission matrix."""

from migration_sql_runner import execute_sql_file

revision = "021_role_permission_matrix"
down_revision = "020_admin_user_management"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("021_finalize_role_permission_matrix.up.sql")


def downgrade() -> None:
    execute_sql_file("021_finalize_role_permission_matrix.down.sql")

