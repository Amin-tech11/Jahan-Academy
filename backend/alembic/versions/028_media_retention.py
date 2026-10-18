"""Track quarantine reservations until replay-safe cleanup has completed."""

from migration_sql_runner import execute_sql_file

revision = "028_media_retention"
down_revision = "027_staff_login_names"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("028_media_retention.up.sql")


def downgrade() -> None:
    execute_sql_file("028_media_retention.down.sql")
