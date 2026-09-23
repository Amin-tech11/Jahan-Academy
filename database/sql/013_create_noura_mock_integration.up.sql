ALTER TABLE integration_outbox
    ADD COLUMN manual_retry_count integer NOT NULL DEFAULT 0 CHECK (manual_retry_count >= 0);

ALTER TABLE integration_sync_records
    ADD COLUMN idempotency_key varchar(140);

UPDATE integration_sync_records sync
SET idempotency_key = outbox.idempotency_key
FROM integration_outbox outbox
WHERE sync.provider = outbox.provider
  AND sync.entity_type = outbox.aggregate_type
  AND sync.entity_id = outbox.aggregate_id
  AND sync.idempotency_key IS NULL;

ALTER TABLE integration_sync_records
    ADD CONSTRAINT uq_integration_sync_idempotency UNIQUE (provider, idempotency_key);

DROP INDEX IF EXISTS ix_outbox_dispatch;
CREATE INDEX ix_outbox_dispatch
    ON integration_outbox(status, next_attempt_at, created_at)
    WHERE status IN ('pending', 'failed', 'processing');

DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE code = 'integrations.retry'
);
DELETE FROM permissions WHERE code = 'integrations.retry';

INSERT INTO permissions (code, description) VALUES
    ('lead.sync.retry', 'Retry failed Noura lead synchronization')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code IN ('super_admin', 'support')
  AND permissions.code = 'lead.sync.retry'
ON CONFLICT DO NOTHING;
