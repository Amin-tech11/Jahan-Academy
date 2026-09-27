-- Temporary operational reporting. Noura ERP remains the final reporting system of record.
INSERT INTO permissions (code, description) VALUES
    ('report.read', 'View temporary read-only operational dashboard metrics')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code IN ('super_admin', 'support')
  AND permissions.code = 'report.read'
ON CONFLICT DO NOTHING;
