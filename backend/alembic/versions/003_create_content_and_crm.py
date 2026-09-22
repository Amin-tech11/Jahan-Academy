"""Create content, lead, and consultation tables."""
from migration_sql_runner import execute_sql_file
revision = "003_content_crm"
down_revision = "002_catalog_media"
branch_labels = None
depends_on = None
def upgrade() -> None: execute_sql_file("003_create_content_and_crm.up.sql")
def downgrade() -> None: execute_sql_file("003_create_content_and_crm.down.sql")
