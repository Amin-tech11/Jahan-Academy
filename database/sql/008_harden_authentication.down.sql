DROP INDEX IF EXISTS ix_user_identities_email_login;
DROP INDEX IF EXISTS ix_password_reset_tokens_active;
DROP INDEX IF EXISTS ix_sessions_family;

ALTER TABLE sessions
    DROP COLUMN IF EXISTS rotated_at,
    DROP COLUMN IF EXISTS parent_session_id,
    DROP COLUMN IF EXISTS family_id;

ALTER TABLE users
    DROP COLUMN IF EXISTS locked_until,
    DROP COLUMN IF EXISTS failed_login_count;
