CREATE TABLE course_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), parent_id uuid REFERENCES course_categories(id) ON DELETE SET NULL,
    slug varchar(160) NOT NULL UNIQUE, active boolean NOT NULL DEFAULT true, display_order integer NOT NULL DEFAULT 0
);
CREATE TABLE course_category_translations (
    course_category_id uuid NOT NULL REFERENCES course_categories(id) ON DELETE CASCADE, locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    name varchar(180) NOT NULL, description text, PRIMARY KEY (course_category_id, locale)
);
CREATE TABLE courses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug varchar(200) NOT NULL UNIQUE,
    delivery_mode varchar(24) NOT NULL CHECK (delivery_mode IN ('recorded','live','hybrid')),
    level_code varchar(30), duration_minutes integer CHECK (duration_minutes >= 0), featured_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
    status varchar(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE TABLE course_translations (
    course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE, locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    title varchar(240) NOT NULL, summary text, description text, seo_title varchar(180), seo_description varchar(320), PRIMARY KEY (course_id, locale)
);
CREATE TABLE instructor_profiles (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, headline_fa varchar(220), headline_en varchar(220),
    biography_fa text, biography_en text, avatar_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
    public boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE course_instructors (
    course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE, instructor_user_id uuid NOT NULL REFERENCES instructor_profiles(user_id) ON DELETE RESTRICT,
    role_code varchar(30) NOT NULL DEFAULT 'instructor', display_order integer NOT NULL DEFAULT 0, PRIMARY KEY (course_id, instructor_user_id)
);
CREATE TABLE course_category_assignments (
    course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE, course_category_id uuid NOT NULL REFERENCES course_categories(id) ON DELETE RESTRICT,
    PRIMARY KEY (course_id, course_category_id)
);
CREATE TABLE course_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title_fa varchar(220) NOT NULL, title_en varchar(220) NOT NULL, description_fa text, description_en text,
    display_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_section_id uuid NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
    lesson_type varchar(24) NOT NULL CHECK (lesson_type IN ('video','text','live','quiz','assignment','download')),
    title_fa varchar(240) NOT NULL, title_en varchar(240) NOT NULL, body_fa text, body_en text,
    duration_seconds integer CHECK (duration_seconds >= 0), preview_available boolean NOT NULL DEFAULT false,
    display_order integer NOT NULL DEFAULT 0, status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE lesson_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    media_asset_id uuid REFERENCES media_assets(id) ON DELETE RESTRICT, asset_type varchar(24) NOT NULL,
    provider_external_id varchar(255), display_order integer NOT NULL DEFAULT 0, CHECK (media_asset_id IS NOT NULL OR provider_external_id IS NOT NULL)
);
CREATE TABLE enrolments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    course_id uuid NOT NULL REFERENCES courses(id) ON DELETE RESTRICT, status varchar(24) NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','completed','cancelled','expired')),
    progress_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100), enrolled_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz, access_expires_at timestamptz, UNIQUE (user_id, course_id)
);
CREATE INDEX ix_enrolments_user_status ON enrolments(user_id, status);
CREATE TABLE lesson_progress (
    enrolment_id uuid NOT NULL REFERENCES enrolments(id) ON DELETE CASCADE, lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    status varchar(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
    position_seconds integer NOT NULL DEFAULT 0 CHECK (position_seconds >= 0), progress_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    started_at timestamptz, completed_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (enrolment_id, lesson_id)
);
CREATE TABLE quizzes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lesson_id uuid NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
    passing_score numeric(5,2) NOT NULL DEFAULT 60 CHECK (passing_score BETWEEN 0 AND 100), max_attempts smallint CHECK (max_attempts > 0), time_limit_minutes integer CHECK (time_limit_minutes > 0)
);
CREATE TABLE quiz_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_type varchar(24) NOT NULL CHECK (question_type IN ('single_choice','multiple_choice','true_false','short_text')),
    prompt_fa text NOT NULL, prompt_en text NOT NULL, points numeric(8,2) NOT NULL DEFAULT 1 CHECK (points > 0), display_order integer NOT NULL DEFAULT 0
);
CREATE TABLE quiz_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    text_fa text NOT NULL, text_en text NOT NULL, is_correct boolean NOT NULL DEFAULT false, display_order integer NOT NULL DEFAULT 0
);
CREATE TABLE quiz_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    enrolment_id uuid NOT NULL REFERENCES enrolments(id) ON DELETE CASCADE, attempt_number smallint NOT NULL CHECK (attempt_number > 0),
    status varchar(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','graded','expired')),
    score numeric(5,2) CHECK (score BETWEEN 0 AND 100), started_at timestamptz NOT NULL DEFAULT now(), submitted_at timestamptz,
    UNIQUE (quiz_id, enrolment_id, attempt_number)
);
CREATE TABLE quiz_answers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quiz_attempt_id uuid NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE, selected_option_ids jsonb, text_answer text,
    awarded_points numeric(8,2), graded_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL, UNIQUE (quiz_attempt_id, question_id)
);
CREATE TABLE course_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, enrolment_id uuid NOT NULL REFERENCES enrolments(id) ON DELETE CASCADE,
    rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5), body text, status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected')),
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (course_id, user_id)
);
