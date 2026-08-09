# Database migrations (manual, review-first)

Plain SQL migrations kept **outside** `prisma/migrations/` on purpose, so nothing
here is auto-applied by `prisma migrate`. Each migration is a reversible pair:

- `NNNN_name.up.sql` — forward change (wrapped in a single transaction)
- `NNNN_name.down.sql` — exact rollback (wrapped in a single transaction)

The Prisma schema in `prisma/schema.prisma` describes the **target** state that
`0001` brings the database to. The app's services still run on the in-memory
`/data` seed arrays (ADR-019); these migrations only prepare the PostgreSQL
database — they do not change any service or API code.

## 0001_align_leads_and_init_domain

- Adds a `users` table and seeds the 5 canonical users from `data/users.ts`.
- Aligns the existing (db-pushed) `leads` table with the domain model without
  dropping it, preserving `lead-001` and any other existing rows.
- Creates `customers`, `appointments`, `tasks`, `services`, `invoices`,
  `activities`, `notes` with RESTRICT foreign keys and supporting indexes.

Column-name notes (SQL reserved words): `appointments.start/end` → `starts_at`/
`ends_at`; `activities.timestamp` → `occurred_at`.

## Applying (run manually — NOT yet applied)

Nothing here has been run against any database. Review first, then:

```bash
# forward
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0001_align_leads_and_init_domain.up.sql

# rollback
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0001_align_leads_and_init_domain.down.sql
```

After applying, regenerate the Prisma client so it matches:

```bash
npx prisma generate
```
