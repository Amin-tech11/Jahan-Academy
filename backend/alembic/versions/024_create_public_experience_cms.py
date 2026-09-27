"""Create public experience CMS for lead-first pages and country guides."""

from migration_sql_runner import execute_sql_file

revision = "024_public_experience_cms"
down_revision = "023_admin_dashboard_reporting"
branch_labels = None
depends_on = None


def upgrade() -> None:
    execute_sql_file("024_create_public_experience_cms.up.sql")


def downgrade() -> None:
    execute_sql_file("024_create_public_experience_cms.down.sql")
