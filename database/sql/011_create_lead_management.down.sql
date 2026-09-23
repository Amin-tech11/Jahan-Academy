DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions
    WHERE code IN ('lead.read.all', 'lead.read.assigned', 'lead.write.all')
);

DELETE FROM permissions
WHERE code IN ('lead.read.all', 'lead.read.assigned', 'lead.write.all');

INSERT INTO permissions (code, description) VALUES
    ('leads.read_all', 'Read all consultation leads'),
    ('leads.read_assigned', 'Read assigned consultation leads')
ON CONFLICT (code) DO NOTHING;

DROP INDEX IF EXISTS ix_leads_archived_timeline;

ALTER TABLE leads
    DROP COLUMN IF EXISTS archive_reason,
    DROP COLUMN IF EXISTS archived_by_user_id,
    DROP COLUMN IF EXISTS row_version;
