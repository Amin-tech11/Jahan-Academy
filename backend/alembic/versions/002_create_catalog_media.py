"""Create geography, catalog, and media tables."""
from migration_sql_runner import execute_sql_file
revision = "002_catalog_media"
down_revision = "001_identity_access"
branch_labels = None
depends_on = None
def upgrade() -> None: execute_sql_file("002_create_catalog_media.up.sql")
def downgrade() -> None: execute_sql_file("002_create_catalog_media.down.sql")
