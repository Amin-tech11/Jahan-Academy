"""Create identity and access tables."""
from migration_sql_runner import execute_sql_file
revision = "001_identity_access"
down_revision = None
branch_labels = None
depends_on = None
def upgrade() -> None: execute_sql_file("001_create_identity_access.up.sql")
def downgrade() -> None: execute_sql_file("001_create_identity_access.down.sql")
