ALTER TABLE users
    ADD COLUMN row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0);

CREATE INDEX ix_users_staff_admin_list
    ON users (status, updated_at DESC, id)
    WHERE deleted_at IS NULL;

INSERT INTO permissions (code, description) VALUES
    ('identity.manage', 'Manage administrative staff identities and access state'),
    ('role.manage', 'Assign and revoke administrative staff roles')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code = 'super_admin'
  AND permissions.code IN ('users.manage_staff', 'identity.manage', 'role.manage')
ON CONFLICT DO NOTHING;
