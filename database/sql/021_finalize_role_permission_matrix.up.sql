-- Approved staff access matrix.  Resource-specific constraints remain in domain policies.
DELETE FROM role_permissions
WHERE role_id IN (
    SELECT id FROM roles WHERE code IN ('super_admin', 'support', 'consultant', 'content_editor')
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = ANY(
    CASE r.code
        WHEN 'super_admin' THEN ARRAY[
            'identity.manage','role.manage','users.manage_staff','audit.read',
            'reference_data.read','reference_data.write','catalog.read','catalog.write',
            'media.read','media.write','content.read','content.write','content.publish',
            'lead.read.all','lead.write.all','lead.assign','lead.sync.retry'
        ]
        WHEN 'support' THEN ARRAY['lead.read.all','lead.write.all','lead.assign','lead.sync.retry']
        WHEN 'consultant' THEN ARRAY['lead.read.assigned','lead.write.assigned']
        WHEN 'content_editor' THEN ARRAY[
            'reference_data.read','reference_data.write','catalog.read','catalog.write',
            'media.read','media.write','content.read','content.write','content.publish'
        ]
    END
)
WHERE r.code IN ('super_admin', 'support', 'consultant', 'content_editor');
