from __future__ import annotations

from pathlib import Path

import sqlparse
from alembic import op

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SQL_ROOT = PROJECT_ROOT / "database" / "sql"


def execute_sql_file(filename: str) -> None:
    sql = (SQL_ROOT / filename).read_text(encoding="utf-8")
    connection = op.get_bind()
    for statement in sqlparse.split(sql):
        normalized = statement.strip()
        if normalized:
            connection.exec_driver_sql(normalized)
