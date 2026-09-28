DELETE FROM role_permissions
WHERE permission_id IN (SELECT id FROM permissions WHERE code = 'report.read');
DELETE FROM permissions WHERE code = 'report.read';
