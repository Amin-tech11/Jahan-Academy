"""Add editorial content management."""

from migration_sql_runner import execute_sql_file

revision = "018_content_management"
down_revision = "017_discovery_api"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("018_create_content_management.up.sql")


def downgrade() -> None:
    execute_sql_file("018_create_content_management.down.sql")
