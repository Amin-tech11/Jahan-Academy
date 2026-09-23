ALTER TABLE leads
    ADD COLUMN deduplication_key char(64),
    ADD COLUMN gender_self_description varchar(100),
    ADD COLUMN duplicate_count integer NOT NULL DEFAULT 0 CHECK (duplicate_count >= 0),
    ADD COLUMN last_duplicate_at timestamptz;

CREATE INDEX ix_leads_deduplication_window
    ON leads(deduplication_key, created_at DESC)
    WHERE deduplication_key IS NOT NULL;

CREATE TABLE lead_submission_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    event_type varchar(20) NOT NULL CHECK (event_type IN ('accepted','duplicate')),
    source_url text,
    request_fingerprint_hash char(64),
    metadata_safe jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_lead_submission_events_timeline
    ON lead_submission_events(lead_id, created_at DESC);
