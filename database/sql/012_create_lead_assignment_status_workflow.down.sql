DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE code IN ('lead.assign', 'lead.write.assigned')
);

DELETE FROM permissions WHERE code IN ('lead.assign', 'lead.write.assigned');

INSERT INTO permissions (code, description) VALUES
    ('leads.assign', 'Assign or reassign leads'),
    ('leads.update_status', 'Update lead status')
ON CONFLICT (code) DO NOTHING;

DROP INDEX IF EXISTS ix_lead_assignments_timeline;

ALTER TABLE lead_assignments
    DROP COLUMN IF EXISTS ended_by_user_id,
    DROP COLUMN IF EXISTS reason;
