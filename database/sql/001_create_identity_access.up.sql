CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    status varchar(24) NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','locked','disabled','anonymized')),
    preferred_locale varchar(5) NOT NULL DEFAULT 'fa' CHECK (preferred_locale IN ('fa','en')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE user_profiles (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    birth_date date,
    nationality_country_id uuid,
    residence_country_id uuid,
    residence_city_text varchar(150),
    onboarding_status varchar(24) NOT NULL DEFAULT 'not_started' CHECK (onboarding_status IN ('not_started','in_progress','completed')),
    completion_percent smallint NOT NULL DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_identities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider varchar(24) NOT NULL CHECK (provider IN ('email','mobile','google','apple','microsoft')),
    provider_subject varchar(320) NOT NULL,
    normalized_value varchar(320),
    password_hash text,
    verified_at timestamptz,
    last_used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_identity_provider_subject UNIQUE (provider, provider_subject),
    CONSTRAINT ck_email_password_hash CHECK (provider <> 'email' OR password_hash IS NOT NULL)
);
CREATE UNIQUE INDEX uq_user_identities_normalized_value
    ON user_identities(provider, normalized_value) WHERE normalized_value IS NOT NULL;
CREATE INDEX ix_user_identities_user_id ON user_identities(user_id);

CREATE TABLE roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(64) NOT NULL UNIQUE,
    name varchar(120) NOT NULL,
    description text,
    is_system boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(100) NOT NULL UNIQUE,
    description text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE role_permissions (
    role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    scope_type varchar(40) NOT NULL DEFAULT 'global',
    scope_id uuid,
    assigned_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    CONSTRAINT ck_user_role_scope CHECK ((scope_type = 'global' AND scope_id IS NULL) OR (scope_type <> 'global' AND scope_id IS NOT NULL))
);
CREATE UNIQUE INDEX uq_active_user_roles ON user_roles(user_id, role_id, scope_type, COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'::uuid)) WHERE revoked_at IS NULL;
CREATE INDEX ix_user_roles_user_id ON user_roles(user_id) WHERE revoked_at IS NULL;

CREATE TABLE user_devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint_hash varchar(128) NOT NULL,
    display_name varchar(120),
    push_token_encrypted bytea,
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    trusted_at timestamptz,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, device_fingerprint_hash)
);

CREATE TABLE sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id uuid REFERENCES user_devices(id) ON DELETE SET NULL,
    token_hash varchar(128) NOT NULL UNIQUE,
    ip_hash varchar(128),
    user_agent varchar(500),
    expires_at timestamptz NOT NULL,
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (expires_at > created_at)
);
CREATE INDEX ix_sessions_active_user ON sessions(user_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE auth_challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    identity_id uuid REFERENCES user_identities(id) ON DELETE CASCADE,
    purpose varchar(32) NOT NULL CHECK (purpose IN ('login','verify_email','verify_mobile','step_up','link_identity')),
    destination_hash varchar(128),
    secret_hash varchar(255) NOT NULL,
    attempt_count smallint NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    max_attempts smallint NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (user_id IS NOT NULL OR identity_id IS NOT NULL),
    CHECK (expires_at > created_at)
);
CREATE INDEX ix_auth_challenges_active ON auth_challenges(purpose, expires_at) WHERE consumed_at IS NULL;

CREATE TABLE password_reset_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id uuid NOT NULL REFERENCES user_identities(id) ON DELETE CASCADE,
    token_hash varchar(128) NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (expires_at > created_at)
);

CREATE TABLE consent_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    lead_id uuid,
    consent_type varchar(40) NOT NULL,
    policy_version varchar(32) NOT NULL,
    granted boolean NOT NULL,
    locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    source varchar(100),
    evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
    recorded_at timestamptz NOT NULL DEFAULT now(),
    CHECK (user_id IS NOT NULL OR lead_id IS NOT NULL)
);
CREATE INDEX ix_consent_records_user ON consent_records(user_id, consent_type, recorded_at DESC) WHERE user_id IS NOT NULL;

CREATE TABLE privacy_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    requester_email varchar(320),
    request_type varchar(24) NOT NULL CHECK (request_type IN ('access','correction','deletion','anonymization','export')),
    status varchar(24) NOT NULL DEFAULT 'new' CHECK (status IN ('new','verifying','in_progress','completed','rejected','cancelled')),
    verified_at timestamptz,
    due_at timestamptz,
    completed_at timestamptz,
    handled_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    safe_notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_privacy_requests_status_due ON privacy_requests(status, due_at);

INSERT INTO roles (code, name, is_system) VALUES
    ('user', 'User', true),
    ('consultant', 'Consultant', true),
    ('support', 'Support', true),
    ('content_editor', 'Content Editor', true),
    ('super_admin', 'Super Admin', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, description) VALUES
    ('content.manage', 'Create, edit, publish, and archive content'),
    ('leads.read_all', 'Read all consultation leads'),
    ('leads.read_assigned', 'Read assigned consultation leads'),
    ('leads.assign', 'Assign or reassign leads'),
    ('leads.update_status', 'Update lead status'),
    ('integrations.retry', 'Retry failed provider synchronization'),
    ('users.manage_staff', 'Manage staff users and roles'),
    ('audit.read', 'Read audit logs')
ON CONFLICT (code) DO NOTHING;
