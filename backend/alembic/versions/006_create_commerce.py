"""Create product, order, payment, refund, and invoice tables."""
from migration_sql_runner import execute_sql_file
revision = "006_commerce"
down_revision = "005_learning"
branch_labels = None
depends_on = None
def upgrade() -> None: execute_sql_file("006_create_commerce.up.sql")
def downgrade() -> None: execute_sql_file("006_create_commerce.down.sql")
