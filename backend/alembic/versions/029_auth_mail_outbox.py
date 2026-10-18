"""Private encrypted authentication email outbox."""

from migration_sql_runner import execute_sql_file

revision = "029_auth_mail_outbox"
down_revision = "028_media_retention"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("029_auth_mail_outbox.up.sql")


def downgrade() -> None:
    execute_sql_file("029_auth_mail_outbox.down.sql")
