DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE code = 'lead.sync.retry'
);
DELETE FROM permissions WHERE code = 'lead.sync.retry';

INSERT INTO permissions (code, description) VALUES
    ('integrations.retry', 'Retry failed provider synchronization')
ON CONFLICT (code) DO NOTHING;

DROP INDEX IF EXISTS ix_outbox_dispatch;
CREATE INDEX ix_outbox_dispatch
    ON integration_outbox(status, next_attempt_at, created_at)
    WHERE status IN ('pending', 'failed');

ALTER TABLE integration_sync_records
    DROP CONSTRAINT IF EXISTS uq_integration_sync_idempotency,
    DROP COLUMN IF EXISTS idempotency_key;

ALTER TABLE integration_outbox
    DROP COLUMN IF EXISTS manual_retry_count;
