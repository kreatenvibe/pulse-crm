-- 0001_align_leads_and_init_domain (UP)
--
-- Aligns the existing db-pushed `leads` table with the domain model and creates
-- the remaining Pulse CRM tables. NON-DESTRUCTIVE: it only ALTERs `leads`
-- (no drop/recreate), so existing rows — including lead-001 — are preserved.
-- Fully reversible via 0001_align_leads_and_init_domain.down.sql.
--
-- Decisions applied: text IDs; TEXT enum-like columns (app-validated);
-- timestamptz everywhere; TEXT[] tags; polymorphic entity_id on activities/notes;
-- FK RESTRICT; BIGINT cents; app-managed updated_at.
--
-- Preconditions: every existing `leads` row has a non-null `phone`
-- (true for the seed data). The whole script runs in one transaction, so any
-- failure rolls everything back and leaves the database untouched.

BEGIN;

-- 1. Users -------------------------------------------------------------------
-- Referenced by the FKs added below. Seed the canonical user set from
-- data/users.ts so existing lead assignees (and future rows) resolve.
-- lead-001 is assigned to user-003.
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  avatar     TEXT,
  role       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO users (id, name, email, avatar, role, is_active, created_at, updated_at) VALUES
  ('user-001', 'Priya Sharma',  'priya.sharma@pulsecrm.in',  '/avatars/priya.jpg', 'admin',   true,  '2025-06-01T09:00:00+05:30', '2026-07-15T11:20:00+05:30'),
  ('user-002', 'Arjun Mehta',   'arjun.mehta@pulsecrm.in',   '/avatars/arjun.jpg', 'manager', true,  '2025-06-01T09:05:00+05:30', '2026-07-20T16:00:00+05:30'),
  ('user-003', 'Ananya Reddy',  'ananya.reddy@pulsecrm.in',  NULL,                 'sales',   true,  '2025-07-10T10:00:00+05:30', '2026-08-01T09:30:00+05:30'),
  ('user-004', 'Vikram Patel',  'vikram.patel@pulsecrm.in',  NULL,                 'sales',   true,  '2025-08-15T10:00:00+05:30', '2026-07-28T14:10:00+05:30'),
  ('user-005', 'Sneha Iyer',    'sneha.iyer@pulsecrm.in',    NULL,                 'sales',   false, '2025-09-01T10:00:00+05:30', '2026-06-30T18:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- 2. Align the existing `leads` table ----------------------------------------
-- The prior `prisma db push` created: id, name, email?, phone?, status, source,
-- priority, created_at/updated_at as TIMESTAMP(6) (no time zone).

-- Convert naive timestamps (stored as UTC wall-clock by Prisma) to timestamptz.
ALTER TABLE leads
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Add the domain columns that db push never created.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS company           TEXT,
  ADD COLUMN IF NOT EXISTS message           TEXT,
  ADD COLUMN IF NOT EXISTS tags              TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS assigned_to       TEXT,
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- Backfill ownership before enforcing NOT NULL + FK.
-- lead-001's real assignee is user-003. Any other pre-existing smoke-test rows
-- default to the same valid user; authoritative assignees will be set by the
-- seed script during the later service migration.
UPDATE leads SET assigned_to = 'user-003' WHERE assigned_to IS NULL;

-- Enforce the domain shape.
ALTER TABLE leads
  ALTER COLUMN phone       SET NOT NULL,
  ALTER COLUMN assigned_to SET NOT NULL;

ALTER TABLE leads
  ADD CONSTRAINT leads_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES users (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON leads (assigned_to);
CREATE INDEX IF NOT EXISTS leads_status_idx      ON leads (status);

-- 3. Customers ---------------------------------------------------------------
CREATE TABLE customers (
  id               TEXT PRIMARY KEY,
  lead_id          TEXT NOT NULL,
  business_name    TEXT,
  primary_contact  TEXT NOT NULL,
  phone            TEXT NOT NULL,
  email            TEXT,
  address          TEXT,
  assigned_to      TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT customers_lead_id_fkey     FOREIGN KEY (lead_id)     REFERENCES leads (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT customers_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
-- One customer per lead (ADR-002).
CREATE UNIQUE INDEX customers_lead_id_key   ON customers (lead_id);
CREATE INDEX        customers_assigned_to_idx ON customers (assigned_to);

-- 4. Appointments ------------------------------------------------------------
-- domain start/end -> starts_at/ends_at (SQL reserved words).
CREATE TABLE appointments (
  id          TEXT PRIMARY KEY,
  lead_id     TEXT,
  customer_id TEXT,
  title       TEXT NOT NULL,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  status      TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT appointments_lead_id_fkey     FOREIGN KEY (lead_id)     REFERENCES leads (id)     ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT appointments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT appointments_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users (id)     ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE INDEX appointments_lead_id_idx     ON appointments (lead_id);
CREATE INDEX appointments_customer_id_idx ON appointments (customer_id);
CREATE INDEX appointments_assigned_to_idx ON appointments (assigned_to);

-- 5. Tasks -------------------------------------------------------------------
CREATE TABLE tasks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT NOT NULL,
  lead_id     TEXT,
  customer_id TEXT,
  due_date    TIMESTAMPTZ NOT NULL,
  priority    TEXT NOT NULL,
  status      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users (id)     ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT tasks_lead_id_fkey     FOREIGN KEY (lead_id)     REFERENCES leads (id)     ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT tasks_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE INDEX tasks_assigned_to_idx ON tasks (assigned_to);
CREATE INDEX tasks_lead_id_idx     ON tasks (lead_id);
CREATE INDEX tasks_customer_id_idx ON tasks (customer_id);

-- 6. Services ----------------------------------------------------------------
CREATE TABLE services (
  id             TEXT PRIMARY KEY,
  customer_id    TEXT NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  status         TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT services_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE INDEX services_customer_id_idx ON services (customer_id);

-- 7. Invoices ----------------------------------------------------------------
CREATE TABLE invoices (
  id             TEXT PRIMARY KEY,
  customer_id    TEXT NOT NULL,
  service_id     TEXT,
  amount_cents   BIGINT NOT NULL,
  currency       TEXT NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  status         TEXT NOT NULL,
  issued_at      TIMESTAMPTZ NOT NULL,
  due_date       TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT invoices_service_id_fkey  FOREIGN KEY (service_id)  REFERENCES services (id)  ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE INDEX invoices_customer_id_idx ON invoices (customer_id);
CREATE INDEX invoices_service_id_idx  ON invoices (service_id);

-- 8. Activities (polymorphic) ------------------------------------------------
-- domain timestamp -> occurred_at (SQL reserved word). entity_id has no FK.
CREATE TABLE activities (
  id           TEXT PRIMARY KEY,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT NOT NULL,
  type         TEXT NOT NULL,
  description  TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  occurred_at  TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT activities_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES users (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE INDEX activities_entity_idx       ON activities (entity_type, entity_id);
CREATE INDEX activities_performed_by_idx ON activities (performed_by);

-- 9. Notes (polymorphic) -----------------------------------------------------
CREATE TABLE notes (
  id          TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE INDEX notes_entity_idx     ON notes (entity_type, entity_id);
CREATE INDEX notes_created_by_idx ON notes (created_by);

COMMIT;
