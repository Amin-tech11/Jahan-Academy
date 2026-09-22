"""Create learning management tables."""
from migration_sql_runner import execute_sql_file
revision = "005_learning"
down_revision = "004_app_docs"
branch_labels = None
depends_on = None
def upgrade() -> None: execute_sql_file("005_create_learning.up.sql")
def downgrade() -> None: execute_sql_file("005_create_learning.down.sql")
