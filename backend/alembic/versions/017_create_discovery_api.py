"""Add full-text indexes for university and program discovery."""

from migration_sql_runner import execute_sql_file

revision = "017_discovery_api"
down_revision = "016_program_management"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("017_create_discovery_api.up.sql")


def downgrade() -> None:
    execute_sql_file("017_create_discovery_api.down.sql")

