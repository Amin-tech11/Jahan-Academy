-- Refuse downgrade while new statuses are in use rather than rewriting lead history.
ALTER TABLE leads DROP CONSTRAINT leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN ('new','assigned','contacted','qualified','not_qualified','converted','closed'));
