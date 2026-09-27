from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class ReportingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def dashboard_rows(self, start: date, end: date) -> dict[str, list[dict[str, Any]]]:
        params = {"start": start, "end": end}
        statements = {
            "leads": """
                SELECT count(*)::integer AS total,
                  count(*) FILTER (WHERE status = 'converted')::integer AS converted
                FROM leads WHERE archived_at IS NULL AND created_at >= :start
                  AND created_at < (CAST(:end AS date) + INTERVAL '1 day')
            """,
            "statuses": """
                SELECT status, count(*)::integer AS count FROM leads
                WHERE archived_at IS NULL AND created_at >= :start
                  AND created_at < (CAST(:end AS date) + INTERVAL '1 day')
                GROUP BY status ORDER BY status
            """,
            "consultants": """
                SELECT l.assigned_consultant_id AS consultant_id,
                  concat_ws(' ', p.first_name, p.last_name) AS name,
                  count(*)::integer AS assigned_leads,
                  count(*) FILTER (WHERE l.status = 'converted')::integer AS converted_leads
                FROM leads l JOIN user_profiles p ON p.user_id = l.assigned_consultant_id
                WHERE l.archived_at IS NULL AND l.assigned_consultant_id IS NOT NULL
                  AND l.created_at >= :start
                  AND l.created_at < (CAST(:end AS date) + INTERVAL '1 day')
                GROUP BY l.assigned_consultant_id, p.first_name, p.last_name
                ORDER BY assigned_leads DESC, name ASC
            """,
            "content": """
                SELECT resource, count(*)::integer AS published_count FROM (
                  SELECT 'university'::text AS resource FROM universities
                    WHERE status = 'published' AND deleted_at IS NULL
                  UNION ALL SELECT 'program' FROM programs
                    WHERE status = 'published' AND deleted_at IS NULL
                  UNION ALL SELECT 'article' FROM articles
                    WHERE status = 'published' AND deleted_at IS NULL
                ) AS published GROUP BY resource ORDER BY resource
            """,
            "sync_statuses": """
                SELECT status, count(*)::integer AS count FROM integration_sync_records
                WHERE provider = 'noura' AND entity_type = 'lead'
                GROUP BY status ORDER BY status
            """,
            "sync_errors": """
                SELECT COALESCE(NULLIF(last_error_safe, ''), 'UNKNOWN') AS code,
                  count(*)::integer AS count, max(updated_at)::date AS latest_at
                FROM integration_sync_records WHERE provider = 'noura' AND entity_type = 'lead'
                  AND status = 'failed'
                GROUP BY COALESCE(NULLIF(last_error_safe, ''), 'UNKNOWN')
                ORDER BY count DESC, code ASC LIMIT 20
            """,
        }
        results: dict[str, list[dict[str, Any]]] = {}
        for name, statement in statements.items():
            result = await self.session.execute(text(statement), params)
            results[name] = [dict(row) for row in result.mappings().all()]
        return results
