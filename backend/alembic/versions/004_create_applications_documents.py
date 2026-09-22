"""Create applicant, application, and document tables."""
from migration_sql_runner import execute_sql_file
revision = "004_app_docs"
down_revision = "003_content_crm"
branch_labels = None
depends_on = None
def upgrade() -> None: execute_sql_file("004_create_applications_documents.up.sql")
def downgrade() -> None: execute_sql_file("004_create_applications_documents.down.sql")
