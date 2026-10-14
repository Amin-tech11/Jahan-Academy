CREATE TABLE staff_login_names (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    username varchar(64) NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_staff_login_name CHECK (
        username = lower(username) AND username ~ '^[a-z][a-z0-9_.-]*$'
    )
);
