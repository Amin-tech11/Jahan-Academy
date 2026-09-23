"""Add validated public media upload lifecycle."""

from migration_sql_runner import execute_sql_file

revision = "014_media_management"
down_revision = "013_noura_mock"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("014_create_media_management.up.sql")


def downgrade() -> None:
    execute_sql_file("014_create_media_management.down.sql")
