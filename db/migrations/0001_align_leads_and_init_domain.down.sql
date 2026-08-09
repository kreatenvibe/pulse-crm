-- 0001_align_leads_and_init_domain (DOWN)
--
-- Reverses the UP migration exactly, restoring the original db-pushed `leads`
-- shape and removing every table/column/seed the UP added. lead-001 (and any
-- other existing lead row) survives: only the added columns are dropped, never
-- the row. Runs in one transaction.

BEGIN;

-- Drop the new tables in reverse dependency order.
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS customers;

-- Revert `leads` to the original db-pushed shape.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_assigned_to_fkey;
DROP INDEX IF EXISTS leads_assigned_to_idx;
DROP INDEX IF EXISTS leads_status_idx;

ALTER TABLE leads
  DROP COLUMN IF EXISTS company,
  DROP COLUMN IF EXISTS message,
  DROP COLUMN IF EXISTS tags,
  DROP COLUMN IF EXISTS assigned_to,
  DROP COLUMN IF EXISTS last_contacted_at;

ALTER TABLE leads ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE leads
  ALTER COLUMN created_at TYPE TIMESTAMP(6) USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMP(6) USING updated_at AT TIME ZONE 'UTC';

-- Users table was created by this migration, so remove it last.
DROP TABLE IF EXISTS users;

COMMIT;
