-- Restore the pre-finalization role grants from migrations 009–020.
DELETE FROM role_permissions
WHERE role_id IN (
    SELECT id FROM roles WHERE code IN ('super_admin', 'support', 'consultant', 'content_editor')
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON p.code = ANY(
    CASE r.code
        WHEN 'super_admin' THEN ARRAY[
            'users.manage_staff','identity.manage','role.manage','reference_data.read',
            'reference_data.write','lead.read.all','lead.write.all','lead.assign','lead.sync.retry',
            'media.read','media.write','catalog.read','catalog.write','content.read','content.write','content.publish'
        ]
        WHEN 'support' THEN ARRAY['reference_data.read','lead.read.all','lead.write.all','lead.assign','lead.sync.retry']
        WHEN 'consultant' THEN ARRAY['lead.read.assigned','lead.write.assigned']
        WHEN 'content_editor' THEN ARRAY[
            'reference_data.read','reference_data.write','media.read','media.write','catalog.read','catalog.write',
            'content.read','content.write','content.publish'
        ]
    END
)
WHERE r.code IN ('super_admin', 'support', 'consultant', 'content_editor');
