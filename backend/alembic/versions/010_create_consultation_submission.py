"""Add durable consultation-submission deduplication and event history."""

from migration_sql_runner import execute_sql_file

revision = "010_consultation_submission"
down_revision = "009_reference_data"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("010_create_consultation_submission.up.sql")


def downgrade() -> None:
    execute_sql_file("010_create_consultation_submission.down.sql")
