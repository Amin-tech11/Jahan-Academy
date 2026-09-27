DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE code IN ('identity.manage', 'role.manage', 'users.manage_staff')
)
AND role_id IN (SELECT id FROM roles WHERE code = 'super_admin');

DELETE FROM permissions WHERE code IN ('identity.manage', 'role.manage');

DROP INDEX IF EXISTS ix_users_staff_admin_list;
ALTER TABLE users DROP COLUMN IF EXISTS row_version;
