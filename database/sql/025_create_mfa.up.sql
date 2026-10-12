CREATE TABLE user_mfa (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    secret_ciphertext text NOT NULL,
    enabled boolean NOT NULL DEFAULT false,
    setup_expires_at timestamptz NOT NULL,
    last_counter bigint NOT NULL DEFAULT -1,
    recovery_hashes text[] NOT NULL DEFAULT '{}',
    updated_at timestamptz NOT NULL DEFAULT now()
);
