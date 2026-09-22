CREATE TABLE articles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug varchar(200) NOT NULL UNIQUE,
    article_type varchar(20) NOT NULL DEFAULT 'article' CHECK (article_type IN ('article','news','guide')),
    author_user_id uuid REFERENCES users(id) ON DELETE SET NULL, featured_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
    status varchar(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    published_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE INDEX ix_articles_publication ON articles(status, published_at DESC) WHERE deleted_at IS NULL;
CREATE TABLE article_translations (
    article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE, locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    title varchar(260) NOT NULL, excerpt text, body text NOT NULL, seo_title varchar(180), seo_description varchar(320),
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (article_id, locale)
);
CREATE TABLE faqs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), status varchar(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE faq_translations (
    faq_id uuid NOT NULL REFERENCES faqs(id) ON DELETE CASCADE, locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    question text NOT NULL, answer text NOT NULL, PRIMARY KEY (faq_id, locale)
);
CREATE TABLE faq_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), faq_id uuid NOT NULL REFERENCES faqs(id) ON DELETE CASCADE,
    target_type varchar(30) NOT NULL CHECK (target_type IN ('homepage','page','country','university','program','course','service')),
    target_id uuid, display_order integer NOT NULL DEFAULT 0,
    UNIQUE (faq_id, target_type, target_id)
);
CREATE TABLE services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug varchar(160) NOT NULL UNIQUE,
    status varchar(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    featured_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL, display_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE TABLE service_translations (
    service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE, locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    name varchar(180) NOT NULL, summary text, body text, seo_title varchar(180), seo_description varchar(320), PRIMARY KEY (service_id, locale)
);
CREATE TABLE campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(80) NOT NULL UNIQUE, name varchar(180) NOT NULL,
    utm_source varchar(120), utm_medium varchar(120), utm_campaign varchar(160), starts_at timestamptz, ends_at timestamptz,
    active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), public_reference varchar(24) NOT NULL UNIQUE,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL, first_name varchar(100) NOT NULL, last_name varchar(100) NOT NULL,
    mobile_raw varchar(40) NOT NULL, mobile_normalized varchar(24) NOT NULL, email varchar(320), desired_country_id uuid REFERENCES countries(id) ON DELETE SET NULL,
    desired_country_text varchar(160), intake_code varchar(20) CHECK (intake_code IN ('spring','summer','fall','winter','unknown')),
    start_year smallint CHECK (start_year BETWEEN 2020 AND 2200), age smallint CHECK (age BETWEEN 18 AND 100),
    gender_code varchar(24), occupation varchar(160), marital_status_code varchar(24), investment_range_code varchar(60), investment_currency char(3),
    message text, locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')), source_url text,
    source_university_id uuid REFERENCES universities(id) ON DELETE SET NULL, source_program_id uuid REFERENCES programs(id) ON DELETE SET NULL,
    campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
    status varchar(24) NOT NULL DEFAULT 'new' CHECK (status IN ('new','assigned','contacted','qualified','not_qualified','converted','closed')),
    assigned_consultant_id uuid REFERENCES users(id) ON DELETE SET NULL, archived_at timestamptz, anonymized_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_leads_phone_created ON leads(mobile_normalized, created_at DESC);
CREATE INDEX ix_leads_operations ON leads(status, assigned_consultant_id, created_at DESC) WHERE archived_at IS NULL;
ALTER TABLE consent_records ADD CONSTRAINT fk_consent_records_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;

CREATE TABLE lead_services (
    lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE, service_id uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    PRIMARY KEY (lead_id, service_id)
);
CREATE TABLE lead_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    assignee_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT, assigned_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    assigned_at timestamptz NOT NULL DEFAULT now(), unassigned_at timestamptz
);
CREATE UNIQUE INDEX uq_active_lead_assignment ON lead_assignments(lead_id) WHERE unassigned_at IS NULL;
CREATE TABLE lead_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    old_status varchar(24), new_status varchar(24) NOT NULL, actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    reason text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_lead_status_history_timeline ON lead_status_history(lead_id, created_at DESC);
CREATE TABLE lead_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    author_user_id uuid REFERENCES users(id) ON DELETE SET NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), edited_at timestamptz
);
CREATE TABLE consultation_bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), public_reference varchar(24) NOT NULL UNIQUE,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL, lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
    consultant_user_id uuid REFERENCES users(id) ON DELETE SET NULL, starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
    timezone varchar(80) NOT NULL, status varchar(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
    meeting_provider varchar(40), meeting_external_id varchar(255), meeting_url_encrypted bytea,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK (ends_at > starts_at), CHECK (user_id IS NOT NULL OR lead_id IS NOT NULL)
);
CREATE INDEX ix_consultation_bookings_consultant_time ON consultation_bookings(consultant_user_id, starts_at, ends_at) WHERE status IN ('pending','confirmed');
CREATE TABLE consultation_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid NOT NULL REFERENCES consultation_bookings(id) ON DELETE CASCADE,
    conducted_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL, outcome_code varchar(40), report text,
    started_at timestamptz, ended_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
