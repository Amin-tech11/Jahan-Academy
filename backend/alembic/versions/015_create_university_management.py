"""Add bilingual university catalog management."""

from migration_sql_runner import execute_sql_file

revision = "015_university_management"
down_revision = "014_media_management"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("015_create_university_management.up.sql")


def downgrade() -> None:
    execute_sql_file("015_create_university_management.down.sql")
