"""Add reference-data management fields, currencies, translations, and permissions."""

from migration_sql_runner import execute_sql_file

revision = "009_reference_data"
down_revision = "008_harden_auth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("009_create_reference_data_management.up.sql")


def downgrade() -> None:
    execute_sql_file("009_create_reference_data_management.down.sql")
