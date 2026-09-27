"""Add production FAQ management lifecycle and ordering."""

from migration_sql_runner import execute_sql_file

revision = "019_faq_management"
down_revision = "018_content_management"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("019_create_faq_management.up.sql")


def downgrade() -> None:
    execute_sql_file("019_create_faq_management.down.sql")
