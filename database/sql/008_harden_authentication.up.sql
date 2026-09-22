ALTER TABLE users
    ADD COLUMN failed_login_count smallint NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
    ADD COLUMN locked_until timestamptz;

ALTER TABLE sessions
    ADD COLUMN family_id uuid,
    ADD COLUMN parent_session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
    ADD COLUMN rotated_at timestamptz;

UPDATE sessions SET family_id = id WHERE family_id IS NULL;
ALTER TABLE sessions ALTER COLUMN family_id SET NOT NULL;

CREATE INDEX ix_sessions_family ON sessions(family_id, created_at);
CREATE INDEX ix_password_reset_tokens_active
    ON password_reset_tokens(token_hash, expires_at) WHERE used_at IS NULL;
CREATE INDEX ix_user_identities_email_login
    ON user_identities(normalized_value) WHERE provider = 'email';
