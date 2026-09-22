CREATE TABLE conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), context_type varchar(30) NOT NULL CHECK (context_type IN ('application','consultation','course','ticket','general')),
    context_id uuid, subject varchar(240), status varchar(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','archived')),
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE conversation_participants (
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at timestamptz NOT NULL DEFAULT now(), left_at timestamptz, last_read_at timestamptz, PRIMARY KEY (conversation_id, user_id)
);
CREATE TABLE messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_user_id uuid REFERENCES users(id) ON DELETE SET NULL, reply_to_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
    body text NOT NULL, attachment_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(), edited_at timestamptz, deleted_at timestamptz
);
CREATE INDEX ix_messages_conversation_timeline ON messages(conversation_id, created_at);
CREATE TABLE tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), public_reference varchar(24) NOT NULL UNIQUE,
    requester_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT, assignee_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    conversation_id uuid NOT NULL UNIQUE REFERENCES conversations(id) ON DELETE RESTRICT, category_code varchar(40),
    priority varchar(16) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
    status varchar(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting_user','resolved','closed')),
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz
);
CREATE INDEX ix_tickets_operations ON tickets(status, priority, assignee_user_id, updated_at DESC);
CREATE TABLE ticket_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    old_status varchar(20), new_status varchar(20) NOT NULL, actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    reason text, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notification_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_code varchar(80) NOT NULL, channel varchar(16) NOT NULL CHECK (channel IN ('in_app','email','sms','push')),
    locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')), subject_template text, body_template text NOT NULL,
    active boolean NOT NULL DEFAULT true, version integer NOT NULL DEFAULT 1 CHECK (version > 0), UNIQUE (event_code, channel, locale, version)
);
CREATE TABLE notification_preferences (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, event_category varchar(60) NOT NULL,
    channel varchar(16) NOT NULL CHECK (channel IN ('in_app','email','sms','push')), enabled boolean NOT NULL DEFAULT true,
    updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, event_category, channel)
);
CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_code varchar(80) NOT NULL, title varchar(240) NOT NULL, body text NOT NULL, target_type varchar(40), target_id uuid,
    read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_notifications_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE TABLE notification_deliveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), notification_id uuid REFERENCES notifications(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, channel varchar(16) NOT NULL CHECK (channel IN ('email','sms','push')),
    destination_hash varchar(128), provider varchar(50), provider_message_id varchar(200),
    status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','failed','suppressed')),
    attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0), last_error_safe text,
    created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz, delivered_at timestamptz
);

CREATE TABLE integration_outbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), aggregate_type varchar(60) NOT NULL, aggregate_id uuid NOT NULL,
    provider varchar(50) NOT NULL, event_type varchar(100) NOT NULL, event_version smallint NOT NULL DEFAULT 1,
    idempotency_key varchar(140) NOT NULL UNIQUE, payload jsonb NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','processing','succeeded','failed','dead')),
    attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0), next_attempt_at timestamptz NOT NULL DEFAULT now(),
    locked_at timestamptz, locked_by varchar(120), published_at timestamptz, completed_at timestamptz, last_error_safe text,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_outbox_dispatch ON integration_outbox(status, next_attempt_at, created_at) WHERE status IN ('pending','failed');
CREATE TABLE integration_sync_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider varchar(50) NOT NULL, entity_type varchar(60) NOT NULL, entity_id uuid NOT NULL,
    external_id varchar(255), status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','synced','failed')),
    attempt_count integer NOT NULL DEFAULT 0, last_attempt_at timestamptz, synced_at timestamptz, last_error_safe text,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (provider, entity_type, entity_id), UNIQUE (provider, external_id)
);
CREATE TABLE webhook_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider varchar(50) NOT NULL, external_event_id varchar(255) NOT NULL,
    event_type varchar(100) NOT NULL, signature_verified boolean NOT NULL DEFAULT false, payload_safe jsonb NOT NULL DEFAULT '{}'::jsonb,
    status varchar(20) NOT NULL DEFAULT 'received' CHECK (status IN ('received','processed','ignored','failed')),
    received_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz, error_safe text, UNIQUE (provider, external_event_id)
);
CREATE TABLE idempotency_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), scope varchar(80) NOT NULL, idempotency_key varchar(160) NOT NULL,
    request_hash char(64) NOT NULL, response_status integer, response_body jsonb, resource_type varchar(60), resource_id uuid,
    expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (scope, idempotency_key)
);
CREATE INDEX ix_idempotency_expiry ON idempotency_keys(expires_at);
CREATE TABLE audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    action varchar(100) NOT NULL, entity_type varchar(60) NOT NULL, entity_id uuid,
    before_safe jsonb, after_safe jsonb, ip_hash varchar(128), user_agent varchar(500), correlation_id varchar(100),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX ix_audit_actor ON audit_logs(actor_user_id, created_at DESC) WHERE actor_user_id IS NOT NULL;
