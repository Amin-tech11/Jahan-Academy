CREATE TABLE auth_mail_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 identity_id uuid NOT NULL REFERENCES user_identities(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK (kind IN ('reset', 'verify')),
 token_hash text NOT NULL UNIQUE,
 ciphertext text NOT NULL,
 expires_at timestamptz NOT NULL,
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 attempt_count integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_auth_mail_outbox_due ON auth_mail_outbox(next_attempt_at);
