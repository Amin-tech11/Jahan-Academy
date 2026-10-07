CREATE TABLE staff_panel_access (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    sections text[] NOT NULL DEFAULT ARRAY['leads']::text[],
    updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT staff_panel_access_sections CHECK (
        sections <@ ARRAY['dashboard','leads','universities','programs','articles','faqs',
            'categories','tags','authors','media','countries','cities','academic-levels',
            'fields-of-study','intakes','currencies']::text[]
    )
);
