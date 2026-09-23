ALTER TABLE leads
    ADD COLUMN row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
    ADD COLUMN archived_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN archive_reason varchar(500);

CREATE INDEX ix_leads_archived_timeline
    ON leads(archived_at DESC, created_at DESC)
    WHERE archived_at IS NOT NULL;

DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE code IN ('leads.read_all', 'leads.read_assigned')
);

DELETE FROM permissions WHERE code IN ('leads.read_all', 'leads.read_assigned');

INSERT INTO permissions (code, description) VALUES
    ('lead.read.all', 'View all consultation leads'),
    ('lead.read.assigned', 'View consultation leads assigned to the current consultant'),
    ('lead.write.all', 'Edit and archive all consultation leads')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code IN ('super_admin', 'support')
  AND permissions.code IN ('lead.read.all', 'lead.write.all')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code = 'consultant'
  AND permissions.code = 'lead.read.assigned'
ON CONFLICT DO NOTHING;
