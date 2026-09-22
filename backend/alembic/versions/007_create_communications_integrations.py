"""Create communication, notification, integration, and audit tables."""
from migration_sql_runner import execute_sql_file
revision = "007_comms_integrations"
down_revision = "006_commerce"
branch_labels = None
depends_on = None
def upgrade() -> None: execute_sql_file("007_create_communications_integrations.up.sql")
def downgrade() -> None: execute_sql_file("007_create_communications_integrations.down.sql")
