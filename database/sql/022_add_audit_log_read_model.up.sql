CREATE INDEX IF NOT EXISTS ix_audit_action_created
    ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_entity_type_created
    ON audit_logs(entity_type, created_at DESC);
