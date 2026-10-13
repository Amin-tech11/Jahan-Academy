ALTER TABLE leads DROP CONSTRAINT leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN ('new','assigned','initial_contact','unanswered','contacted','qualified','not_qualified','converted','closed'));
