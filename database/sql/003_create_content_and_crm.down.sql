ALTER TABLE consent_records DROP CONSTRAINT IF EXISTS fk_consent_records_lead;
DROP TABLE IF EXISTS consultation_sessions, consultation_bookings, lead_notes, lead_status_history, lead_assignments, lead_services, leads;
DROP TABLE IF EXISTS campaigns, service_translations, services, faq_assignments, faq_translations, faqs, article_translations, articles;
