"""Add optional encrypted TOTP credentials and hashed one-use recovery codes."""
from migration_sql_runner import execute_sql_file

revision = "025_mfa"
down_revision = "024_panel_access"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("025_create_mfa.up.sql")


def downgrade() -> None:
    execute_sql_file("025_create_mfa.down.sql")
