"""Add indexed immutable audit-log read support."""

from migration_sql_runner import execute_sql_file

revision = "022_audit_log"
down_revision = "021_role_permission_matrix"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("022_add_audit_log_read_model.up.sql")


def downgrade() -> None:
    execute_sql_file("022_add_audit_log_read_model.down.sql")
