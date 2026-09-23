ALTER TABLE lead_assignments
    ADD COLUMN reason varchar(500),
    ADD COLUMN ended_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX ix_lead_assignments_timeline
    ON lead_assignments(lead_id, assigned_at DESC);

INSERT INTO lead_assignments (lead_id, assignee_user_id, assigned_at)
SELECT leads.id, leads.assigned_consultant_id, leads.updated_at
FROM leads
WHERE leads.assigned_consultant_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM lead_assignments
      WHERE lead_assignments.lead_id = leads.id
        AND lead_assignments.unassigned_at IS NULL
  );

DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE code IN ('leads.assign', 'leads.update_status')
);

DELETE FROM permissions WHERE code IN ('leads.assign', 'leads.update_status');

INSERT INTO permissions (code, description) VALUES
    ('lead.assign', 'Assign or transfer consultation leads'),
    ('lead.write.assigned', 'Update workflow status for assigned consultation leads')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code IN ('super_admin', 'support')
  AND permissions.code = 'lead.assign'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code = 'consultant'
  AND permissions.code = 'lead.write.assigned'
ON CONFLICT DO NOTHING;
