CREATE TABLE documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    document_type varchar(50) NOT NULL, title varchar(200), status varchar(24) NOT NULL DEFAULT 'pending_upload' CHECK (status IN ('pending_upload','uploaded','under_review','approved','needs_correction','rejected','archived')),
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz
);
CREATE INDEX ix_documents_owner_type ON documents(owner_user_id, document_type, status);
CREATE TABLE document_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT, version_number integer NOT NULL CHECK (version_number > 0),
    uploaded_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL, scan_status varchar(24) NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending','clean','infected','failed')),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (document_id, version_number)
);
CREATE TABLE document_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_version_id uuid NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
    reviewer_user_id uuid REFERENCES users(id) ON DELETE SET NULL, decision varchar(24) NOT NULL CHECK (decision IN ('approved','needs_correction','rejected')),
    feedback text, reviewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE study_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    target_level_id uuid REFERENCES academic_levels(id) ON DELETE SET NULL, target_intake_id uuid REFERENCES intakes(id) ON DELETE SET NULL,
    target_year smallint CHECK (target_year BETWEEN 2020 AND 2200), budget_min_minor bigint CHECK (budget_min_minor >= 0), budget_max_minor bigint CHECK (budget_max_minor >= 0),
    budget_currency char(3), needs_scholarship boolean NOT NULL DEFAULT false, constraints jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE preferred_countries (
    study_preference_id uuid NOT NULL REFERENCES study_preferences(id) ON DELETE CASCADE, country_id uuid NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
    priority smallint NOT NULL DEFAULT 1 CHECK (priority > 0), PRIMARY KEY (study_preference_id, country_id)
);
CREATE TABLE preferred_fields (
    study_preference_id uuid NOT NULL REFERENCES study_preferences(id) ON DELETE CASCADE, field_of_study_id uuid NOT NULL REFERENCES fields_of_study(id) ON DELETE RESTRICT,
    priority smallint NOT NULL DEFAULT 1 CHECK (priority > 0), PRIMARY KEY (study_preference_id, field_of_study_id)
);
CREATE TABLE education_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level_code varchar(40) NOT NULL, institution_name varchar(240) NOT NULL, field_name varchar(200), country_id uuid REFERENCES countries(id) ON DELETE SET NULL,
    grade_value numeric(8,3), grade_scale varchar(30), started_on date, ended_on date, graduation_status varchar(30), study_gap_months integer CHECK (study_gap_months >= 0),
    backlog_count integer CHECK (backlog_count >= 0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_education_records_user ON education_records(user_id, ended_on DESC);
CREATE TABLE language_tests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_type varchar(30) NOT NULL, status varchar(24) NOT NULL DEFAULT 'completed' CHECK (status IN ('planned','completed','no_test')),
    overall_score numeric(6,2), reading_score numeric(6,2), writing_score numeric(6,2), listening_score numeric(6,2), speaking_score numeric(6,2),
    test_date date, expires_on date, document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE work_experiences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name varchar(200) NOT NULL, job_title varchar(180) NOT NULL, started_on date, ended_on date, is_current boolean NOT NULL DEFAULT false,
    description text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK (ended_on IS NULL OR started_on IS NULL OR ended_on >= started_on)
);

CREATE TABLE applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), public_reference varchar(24) NOT NULL UNIQUE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT, program_id uuid NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    program_intake_id uuid REFERENCES program_intakes(id) ON DELETE SET NULL, status varchar(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','profile_incomplete','documents_pending','under_review','ready_to_submit','submitted','decision_received','accepted','rejected','withdrawn','closed')),
    assigned_consultant_id uuid REFERENCES users(id) ON DELETE SET NULL, completeness_percent smallint NOT NULL DEFAULT 0 CHECK (completeness_percent BETWEEN 0 AND 100),
    submitted_at timestamptz, closed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_applications_user ON applications(user_id, created_at DESC);
CREATE INDEX ix_applications_operations ON applications(status, assigned_consultant_id, updated_at DESC);
CREATE TABLE application_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    old_status varchar(32), new_status varchar(32) NOT NULL, actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    reason text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_application_status_timeline ON application_status_history(application_id, created_at DESC);
CREATE TABLE application_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    assigned_to_user_id uuid REFERENCES users(id) ON DELETE SET NULL, task_type varchar(50) NOT NULL, title varchar(220) NOT NULL, description text,
    status varchar(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','cancelled')),
    due_at timestamptz, completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_application_tasks_assignee_due ON application_tasks(assigned_to_user_id, status, due_at);
CREATE TABLE application_requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    source_program_requirement_id uuid REFERENCES program_requirements(id) ON DELETE SET NULL, requirement_type varchar(50) NOT NULL,
    title varchar(220) NOT NULL, required boolean NOT NULL DEFAULT true, status varchar(24) NOT NULL DEFAULT 'missing' CHECK (status IN ('missing','uploaded','under_review','satisfied','waived','rejected')),
    due_on date, display_order integer NOT NULL DEFAULT 0
);
CREATE TABLE application_documents (
    application_requirement_id uuid NOT NULL REFERENCES application_requirements(id) ON DELETE CASCADE,
    document_version_id uuid NOT NULL REFERENCES document_versions(id) ON DELETE RESTRICT,
    attached_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL, attached_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (application_requirement_id, document_version_id)
);
CREATE TABLE application_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    author_user_id uuid REFERENCES users(id) ON DELETE SET NULL, visibility varchar(20) NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal','applicant')),
    body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), edited_at timestamptz
);
CREATE TABLE application_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    submitted_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL, destination varchar(80) NOT NULL,
    external_reference varchar(200), status varchar(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','confirmed','failed','cancelled')),
    submitted_at timestamptz, response_safe jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
