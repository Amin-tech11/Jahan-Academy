"""Add administrative staff lifecycle and access-management support."""

from migration_sql_runner import execute_sql_file

revision = "020_admin_user_management"
down_revision = "019_faq_management"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("020_create_admin_user_management.up.sql")


def downgrade() -> None:
    execute_sql_file("020_create_admin_user_management.down.sql")
