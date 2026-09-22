"""Add rotating refresh-token families and temporary login lockout state."""

from migration_sql_runner import execute_sql_file

revision = "008_harden_auth"
down_revision = "007_comms_integrations"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("008_harden_authentication.up.sql")


def downgrade() -> None:
    execute_sql_file("008_harden_authentication.down.sql")
