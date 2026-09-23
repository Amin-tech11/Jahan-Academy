"""Add academic program catalog management."""

from migration_sql_runner import execute_sql_file

revision = "016_program_management"
down_revision = "015_university_management"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("016_create_program_management.up.sql")


def downgrade() -> None:
    execute_sql_file("016_create_program_management.down.sql")
