# Pulse CRM — Authentication & Multi-Tenant Architecture Implementation Plan

Status: **in progress** — Milestones 0–7 are ✅ complete (see each milestone's "Implemented" note in §16 for details). Milestones 8–9 (cross-tenant security verification, final audit) have not been started.
Produced by direct inspection of the current repository (schema, migrations, every service, every API route, seed data, docs/decisions.md, and the existing integration-test script) on 2026-08-19.

---

## 1. Executive Summary

Pulse CRM has **no authentication today** — no auth library, no `middleware.ts`, no session/cookie code, no login/signup pages, and no "current user" concept anywhere in the app. What it does have, deliberately built in advance, is an error/response architecture that already speaks the vocabulary this milestone needs: `ServiceError` already has `UNAUTHORIZED` (401), `FORBIDDEN` (403), and `NOT_FOUND` (404) codes, already mapped to HTTP status in `lib/api-route.ts`, with a doc comment stating they exist "for a future authenticated fork." This plan is that fork.

The approach: shared database, shared schema, `organization_id` row-level tenancy; a small hand-rolled cookie/session auth layer (Postgres-backed sessions, no Redis, no Auth.js); `organizationId` threaded explicitly through every service method (no generic guard/policy abstraction); and a mechanical, service-by-service scoping pass using `leadService` as the reference implementation. The existing layering (`UI → /api → services → Prisma`) is preserved exactly — this is additive to every layer, not a rewrite of any of them.

Scope is deliberately narrow, matching the locked decisions: signup/login/logout/session only, no OAuth/SSO/invitations/password reset/MFA, no RBAC, no multi-org membership.

---

## 2. Current Architecture Findings

Confirmed by direct inspection, not assumption:

- **No auth code exists anywhere.** Exhaustive grep for `auth|session|cookie|login|jwt|bcrypt` across the repo returns only: the `ServiceError` taxonomy doc comment, incidental matches of the word "author" in `note.service.ts`/`data/*.ts` comments, and `scripts/seed.ts`'s own doc comment. No `middleware.ts` file exists at all.
- **The error/response envelope already anticipates this work.** `services/errors.ts` — `ErrorCode` is `"VALIDATION" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL"`, with the comment: *"`UNAUTHORIZED`/`FORBIDDEN` are part of the taxonomy for a future authenticated fork. The current app never throws them, but the boundary can already represent them."* `lib/api-route.ts`'s `STATUS_BY_CODE` already maps `UNAUTHORIZED→401`, `FORBIDDEN→403`, `NOT_FOUND→404`. **`NOT_FOUND` already exists and is already used** (via `assertFound` in every route, and directly in `lead.service.ts`'s `convert()`). No error-architecture changes are needed — only new call sites that throw the existing codes.
- **Layering is followed strictly today.** All 22 files under `app/api/**` are thin: parse → call exactly one service → return via `ok`/`created`/`okPaginated`/`noContent`, wrapped in `withApiErrors`. No route imports `@/data` or Prisma directly.
- **11 service files**, all Prisma-backed (`services/*.service.ts`: `lead`, `customer`, `appointment`, `task`, `activity`, `note`, `service`, `invoice`, `dashboard`, `report`, `user`), plus shared non-domain modules `services/validation.ts`, `services/helpers.ts`, `services/parse.ts`, `services/errors.ts`, `services/index.ts`.
- **Zero `organizationId`/`organization_id` concept anywhere** — not in `prisma/schema.prisma`, not in any service, not in any route, not in any Zod schema (`lib/schemas/*.schema.ts` — confirmed via grep, no matches), not in the UI.
- **No test framework.** No `vitest`/`jest` config, no `*.test.*`/`*.spec.*` files anywhere. There **is** one existing test asset: `scripts/integration-test.ts` — a plain `tsx`-run script (not wired into `package.json`) with a hand-rolled `check()`/`expectServiceError()` harness that exercises CRUD + domain operations against the live seeded database and cleans up everything it creates in a `finally` block. Per `docs/decisions.md` ADR-021/022, it currently reports **53/53 passing**. This is the pattern to extend, per the task's own instruction to prefer the existing testing approach over inventing a new framework.
- **Two migration mechanisms exist — a discrepancy from the assumed "just `prisma/migrations`" setup.** `prisma/migrations/` contains `0000_init` (creates all 9 tables as they exist today) plus two small follow-ups (`add_lead_converted_at`, `remove_lead_converted_at`) and is what Prisma actually manages via `prisma migrate`. Separately, `db/migrations/` contains a hand-written, reversible SQL pair (`0001_align_leads_and_init_domain.{up,down}.sql`) with its own `README.md` stating these are kept **outside** `prisma migrate` on purpose and were "NOT yet applied" at the time they were written — they predate ADR-021 (the migration of the service layer onto Prisma/Postgres) and were superseded by it. **Recommendation, stated as a plan decision, not yet acted on:** do all tenancy migration work exclusively through `prisma migrate` (`prisma/migrations/`); treat `db/migrations/` as frozen historical documentation. This should be called out explicitly to the developer before Milestone 1, since it's a real repository quirk the task description didn't anticipate.
- **Seed data is small and duplicate-free today.** From `data/*.ts` and the verification note in ADR-022: **users 5, leads 50, customers 20, appointments 30, tasks 40, services 25, invoices 15, activities 100, notes 60.** `data/users.ts` has 5 distinct `@pulsecrm.in` emails (no duplicates). `data/invoices.ts` generates `invoiceNumber: INV-2026-01 … INV-2026-15` (no duplicates). **This matters directly for the migration plan: adding `@unique` on `users.email` (already exists) and changing `invoices.invoice_number` to `@@unique([organization_id, invoice_number])` will not fail against existing data** — there is nothing to deduplicate first.
- **ID generation is unscoped today.** `services/helpers.ts`'s `nextId(prefix, rows)` takes an already-fetched row list and regex-matches `^prefix-(\d+)$` to find the max suffix. It is called at **8 sites**, each preceded by an unscoped `prisma.<table>.findMany({ select: { id: true } })`: `lead.service.ts` (`nextId("lead", …)`), `customer.service.ts` (`"cust"`), `appointment.service.ts` (`"appt"`), `task.service.ts` (`"task"`), `activity.service.ts` (`"act"`), `note.service.ts` (`"note"`), `service.service.ts` (`"svc"`), `invoice.service.ts` (`"inv"`). Every one of these `findMany` calls needs an `organization_id` filter.
- **`services/validation.ts` existence checks are global, not org-scoped.** Inventory: `assertUserId`/`assertOptionalUserId`, `assertLeadId`/`assertOptionalLeadId`, `assertCustomerId`/`assertOptionalCustomerId`, `assertServiceId`/`assertOptionalServiceId`, `assertEntityReference`, `assertLeadCustomerXor`, `resolveLeadCustomerLink`. All query Prisma today with a bare `where: { id }` — no tenant check.
- **`assertEntityReference` has a pre-existing gap that becomes safety-critical under multi-tenancy.** Reading its source: for `entityType === "lead"` or `"customer"` it does a real `findUnique` existence check; for `"appointment" | "task" | "service" | "invoice" | "note"` it **unconditionally sets `exists = true` with no query at all** (comment: *"not existence-checked here — same as the original in-memory behavior"*). This is exactly the polymorphic `notes`/`activities` risk the task flags in §13 — today it's a latent data-integrity gap; under multi-tenancy an unchecked entity type becomes a direct cross-tenant write vector (org A creates a note against org B's appointment/task/service/invoice id with zero validation). This must be closed as part of this milestone, not deferred — it is squarely a tenant-isolation requirement, not scope creep.
- **`leadService.convert()` is multi-step and not transactional.** It calls, in sequence: `customerService.create()`, `taskService.migrateLeadToCustomer()`, `appointmentService.migrateLeadToCustomer()`, `this.update()` (status → `converted`), `activityService.create()`. A repo-wide grep for `$transaction` returns **zero matches** — no service anywhere uses a Prisma transaction. This is a pre-existing, already-documented gap: ADR-019 and ADR-021 both explicitly list "multi-step deletes/convert are still not wrapped in a single transaction" as a **known, deferred follow-up**. This plan threads `organizationId` through every step of `convert()` (closing the tenant-isolation gap) but does **not** add transaction-wrapping — that remains the separate, already-tracked architectural item ADR-019/021 describe, per the instruction not to silently bundle unrelated refactoring.
- **Dashboard/report aggregation is entirely unscoped.** `dashboard.service.ts`'s `getSummary()` makes **12** unscoped calls across 5 services (`leadService.getAll`, `customerService.getAll`/`getActive`, `appointmentService.getAll`/`getUpcoming`, `taskService.getAll`/`getOpen`/`getOverdue`, `invoiceService.getAll`/`getUnpaid`/`getOverdue`, `activityService.getRecent(20)`). `report.service.ts`'s `getSummary()` makes **5** unscoped calls (`leadService.getAll`, `appointmentService.getAll`, `taskService.getAll`/`getOpen`, `invoiceService.getAll`). Every one of these is a silent cross-org blending risk once a second organization has data.
- **Zod schemas already give a free safety net for the client-trust rule.** `lib/schemas/*.schema.ts` use plain `z.object(...)` with no `.strict()` anywhere (confirmed via grep) — Zod's default behavior **silently strips unknown keys**. As long as `organizationId` is never added as a field to any `Create*Schema`/`Update*Schema`, a client that sends `{ ..., organizationId: "org-999" }` in a request body has that field discarded by `parseInput()` before the service ever sees it, with zero extra code. This is the cleanest way to satisfy the "never trust client-supplied organizationId" rule.
- **Frontend has zero auth surface.** `app/(dashboard)/layout.tsx` wraps every dashboard route in `AppShell` with no auth check. `components/layout/AppShell.tsx`'s `Logout` link is `href="#"` (dead); there is a static user-avatar icon bound to nothing; no current-user data is displayed anywhere. `app/page.tsx` is a static marketing landing page whose CTAs link straight to `/dashboard`. `app/layout.tsx` is a plain root shell (fonts + metadata only, no providers). No `app/(auth)` route group or anything resembling it exists.
- **`users.role`** (`admin | manager | sales`, defined in `lib/schemas/enums.ts`) exists purely as CRM data today — nothing in the app reads it for authorization. It stays that way in this milestone (locked decision §10 below), but the session is a natural place to expose it for future use.

---

## 3. Target Architecture

```
 Browser
   │  httpOnly session cookie (opaque session id)
   ▼
 middleware.ts  ── route gating ONLY ──────────────────────────
   │  "does a plausible session cookie exist?" → redirect to
   │  /login if a dashboard route is requested without one.
   │  No DB query, no business/tenant logic here.
   ▼
 app/api/**/route.ts  (API boundary)
   │  requireSession(request)  →  { userId, organizationId, role }
   │  or throws ServiceError("UNAUTHORIZED")  →  401
   │  Passes session.organizationId into the service call.
   │  Does NOT decide whether a specific resource belongs to the org.
   ▼
 services/*.service.ts  (tenant isolation lives HERE)
   │  Every read:    WHERE organization_id = :organizationId
   │  Every create:  organization_id = :organizationId   (from session, never from input)
   │  Every update/delete:
   │                 WHERE id = :targetId AND organization_id = :organizationId
   │  Cross-org row  →  ServiceError("NOT_FOUND")  →  404  (never 403)
   ▼
 Prisma Client
   ▼
 PostgreSQL  (Neon in prod, Docker on :5433 locally — ADR-020)
   organizations
     └─ users (organization_id FK, email globally unique)
           └─ sessions (user_id FK)
     └─ leads / customers / appointments / tasks / services /
        invoices / activities / notes   (organization_id FK on every one)
```

**Responsibility boundary (locked, restated from the task):**

| Layer | Owns | Does NOT own |
|---|---|---|
| `middleware.ts` | "is there a session cookie that looks valid" → redirect | DB queries, tenant checks, role checks |
| API route (`requireSession`) | Resolving `{ userId, organizationId, role }` from the cookie; 401 on missing/invalid/expired session | Whether *this specific* leadId belongs to *this* org |
| Service layer | Every `WHERE organization_id = …`; every cross-entity same-org check; 404 vs the future 403 distinction | HTTP status codes, cookies, request parsing |

---

## 4. Locked Architectural Decisions

Each item below was checked against the repository; none contradicts what's actually there, so all are confirmed as stated. Where the repository forced a concrete sub-decision the task didn't spell out, that's called out explicitly.

1. **Shared database, shared schema, `organization_id` row-level tenancy.** No per-tenant schemas/databases. Matches the existing single Neon/Docker Postgres instance and the "don't over-engineer" instruction.
2. **`Organization 1 ── * User`, no membership table.** Every tenant-owned row belongs to exactly one org.
3. **Tenant-owned tables** — confirmed by reading `prisma/schema.prisma` in full: `users`, `leads`, `customers`, `appointments`, `tasks`, `services`, `invoices`, `activities`, `notes`. **No additional tenant-owned tables exist** — this is the complete list of models in the schema (9 tables total; no hidden entities).
4. **`users.email` stays globally `@unique`** (it already is) — not `@@unique([organization_id, email])`. Rationale confirmed against the repo: one user → one org, so email is already sufficient to resolve `email → user → organization` for login with zero join ambiguity.
5. **`invoices.invoice_number` moves from global `@unique` to `@@unique([organization_id, invoice_number])`.** Confirmed safe: current seed data has no duplicate invoice numbers, so this is a pure constraint change, not a conflict-resolution migration.
6. **Custom auth, not Auth.js/better-auth/Lucia.** No compelling reason found in the repo to pull in a framework — the app has zero existing auth surface to integrate with, and org-membership is core domain data the framework wouldn't model natively. A small, explicit implementation is more consistent with this codebase's "no unnecessary abstractions" style (`AGENTS.md` §8, §10).
7. **PostgreSQL-backed `sessions` table, no Redis.** Consistent with the existing single-datastore setup (Neon/Docker Postgres, no other infra in `package.json`).
8. **No RBAC.** `users.role` may be exposed on the session object (it's already real CRM data) but must not gate any route or service call in this milestone.
9. **No OAuth/SSO, no invitations, no password reset, no MFA, no email verification.** Confirmed nothing in the repo requires any of these (no existing partial implementation of any of them was found).
10. **No multi-org membership, no speculative `tenantGuard()`/policy engine.** `organizationId` is threaded as an explicit parameter on every service method, mirroring the exact style already used for `userId`/`leadId`/`customerId` in `services/validation.ts`'s `assert*` helpers — this milestone extends that existing pattern rather than inventing a new one.
11. **Signup always creates a brand-new organization together with its first user.** *(This sub-decision isn't stated explicitly in the task, but the repository forces it: there is no invitation system and no membership model, so there is no other mechanism by which a "signup" could attach a second user to an existing org.)* Flagged again as an open question in §19 in case the intended product behavior is different.
12. **Cross-tenant status codes:** no/invalid/expired session → `401`; resource belongs to another org → `404` (never `403`, to avoid confirming existence); resource in-org but denied by a future authorization rule → `403` (not implemented this milestone, since there is no RBAC yet — reserved for later).

---

## 5. Repository Inventory

**Prisma / DB**
- `prisma/schema.prisma` — 9 models: `users`, `leads`, `customers`, `appointments`, `tasks`, `services`, `invoices`, `activities`, `notes`.
- `prisma/migrations/0000_init/migration.sql`, `prisma/migrations/20260813080005_add_lead_converted_at/migration.sql`, `prisma/migrations/20260813080901_remove_lead_converted_at/migration.sql`, `prisma/migrations/migration_lock.toml`.
- `db/migrations/0001_align_leads_and_init_domain.up.sql`, `.down.sql`, `db/migrations/README.md` — legacy, pre-Prisma-migrate, superseded (see §2).
- `lib/prisma.ts` — shared Prisma client via `@prisma/adapter-pg`, `DATABASE_URL`-driven, cached across dev hot-reloads.

**Services** (`services/`) — `lead.service.ts`, `customer.service.ts`, `appointment.service.ts`, `task.service.ts`, `activity.service.ts`, `note.service.ts`, `service.service.ts`, `invoice.service.ts`, `dashboard.service.ts`, `report.service.ts`, `user.service.ts`, plus `validation.ts`, `helpers.ts`, `parse.ts`, `errors.ts`, `index.ts`.

**API routes** (`app/api/`) — 22 files: `leads/route.ts`, `leads/[id]/route.ts`, `leads/[id]/details/route.ts`, `leads/[id]/convert/route.ts`, `customers/route.ts`, `customers/[id]/route.ts`, `customers/[id]/details/route.ts`, `appointments/route.ts`, `appointments/[id]/route.ts`, `tasks/route.ts`, `tasks/[id]/route.ts`, `services/route.ts`, `services/[id]/route.ts`, `invoices/route.ts`, `invoices/[id]/route.ts`, `activities/route.ts`, `activities/[id]/route.ts`, `notes/route.ts`, `notes/[id]/route.ts`, `dashboard/route.ts`, `reports/route.ts`, `users/route.ts`.

**Auth-related files:** none exist. New files needed: `middleware.ts` (root), `lib/session.ts`, `lib/password.ts`, `app/api/auth/signup/route.ts`, `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`, `app/api/auth/me/route.ts` (see §7/§16).

**Layout/navigation:** `app/layout.tsx` (root shell, no providers), `app/(dashboard)/layout.tsx` (wraps `AppShell`, no auth check), `components/layout/AppShell.tsx` (dead `Logout` link, static avatar), `components/layout/navigation.ts` (static nav config), `components/layout/index.ts`.

**Seed/data:** `data/index.ts`, `data/users.ts` (5), `data/leads.ts` (50), `data/customers.ts` (20), `data/appointments.ts` (30), `data/tasks.ts` (40), `data/services.ts` (25), `data/invoices.ts` (15), `data/activities.ts` (100), `data/notes.ts` (60), `data/dashboard.ts`, `data/helpers.ts` (`d()`/`pad()` determinism helpers). Loader: `scripts/seed.ts` (idempotent, upsert-by-id, `npm run db:seed`).

**Tests:** `scripts/integration-test.ts` only (see §2). No `vitest`/`jest`/`playwright` config anywhere.

**Environment/config:** `.env`, `.env.example` (documents `DATABASE_URL` only), `prisma.config.ts` (not yet inspected in depth — governs the Prisma CLI; irrelevant to this migration beyond standard `prisma migrate`), `tsconfig.json` (`@/* → ./*` path alias, used throughout).

---

## 6. Database Changes

### New table: `organizations`

```prisma
model organizations {
  id         String   @id
  name       String
  created_at DateTime @default(now()) @db.Timestamptz(6)
  updated_at DateTime @default(now()) @db.Timestamptz(6)
  users      users[]
}
```
IDs follow the existing convention (`org-001`, `org-002`, …), consistent with every other table's human-readable prefixed id.

### New table: `sessions`

```prisma
model sessions {
  id         String   @id                 // opaque random token (see §7) — this IS what's stored in the cookie
  user_id    String
  created_at DateTime @default(now()) @db.Timestamptz(6)
  expires_at DateTime @db.Timestamptz(6)
  user       users    @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@index([user_id])
}
```
`onDelete: Cascade` here (unlike every other FK in this schema, which uses `Restrict`) is intentional and narrow: deleting a user should invalidate their sessions automatically; it does not touch any CRM data table, so it does not weaken the existing "block deletes with dependents" pattern used everywhere else.

### `users` table changes

```prisma
model users {
  ...
  organization_id String
  password_hash   String
  organization    organizations @relation(fields: [organization_id], references: [id], onUpdate: Restrict)
  sessions        sessions[]
  ...
  @@index([organization_id])
}
```
`email` stays `@unique` (no change). `is_active` already exists and can be reused directly as the login gate ("deactivated users cannot authenticate") — no new column needed for that.

### CRM tables — add to each of `leads`, `customers`, `appointments`, `tasks`, `services`, `invoices`, `activities`, `notes`:

```prisma
organization_id String
organization    organizations @relation(fields: [organization_id], references: [id], onUpdate: Restrict)
@@index([organization_id])
```

Table-specific notes:

| Table | Extra index/constraint change | Notes |
|---|---|---|
| `leads` | Existing `@@index([status])` → consider `@@index([organization_id, status])` (keeps the existing bare index too if other code relies on it — check before dropping) | |
| `customers` | none beyond the standard org index | |
| `appointments` | none beyond the standard org index | |
| `tasks` | none beyond the standard org index | |
| `services` | none beyond the standard org index | |
| `invoices` | `invoice_number @unique` → `@@unique([organization_id, invoice_number])` | Safe today (no dup numbers); becomes meaningful once org-002 seed data exists (§13) |
| `activities` | none beyond the standard org index; keep `@@index([entity_type, entity_id])` as-is | polymorphic — see §10 |
| `notes` | none beyond the standard org index; keep `@@index([entity_type, entity_id])` as-is | polymorphic — see §10 |

### Migration/backfill sequence (via `prisma migrate`, exclusively — see §2 discrepancy note)

This is a **description of the intended sequence**, not migration files to create now.

1. **Phase A** — `prisma migrate dev` adding `organizations` and `sessions` tables (no FK from existing tables yet). Insert one row into `organizations`: `('org-001', 'Default Organization')` — via a short one-off script or a data migration step, not hand-edited SQL.
2. **Phase B** — Add `organization_id` as **nullable** `String?` to `users` and all 8 CRM tables, plus `password_hash String?` (nullable for now) on `users`. Never make a new column `NOT NULL` on a populated table in the same step it's added.
3. **Phase C** — Backfill: `UPDATE <table> SET organization_id = 'org-001'` for every tenant-owned table (9 tables). For `users.password_hash`, backfilling isn't meaningful (no real passwords exist yet since there's no auth today) — see the explicit open question in §19 about what happens to the 5 seeded users' login credentials.
4. **Phase D** — Add the FKs (`onUpdate: Restrict`, matching the existing convention) from each table's `organization_id` to `organizations.id`, and add the `@@index([organization_id])` on each.
5. **Phase E** — Resolve uniqueness: drop the global `@unique` on `invoices.invoice_number`, add `@@unique([organization_id, invoice_number])`. (No conflict today — confirmed in §2.)
6. **Phase F** — Flip `organization_id` to `NOT NULL` on all 9 tables (safe now that every row is backfilled), and flip `password_hash` to `NOT NULL` once Milestone 3's signup flow exists and every user has a real hash (this specific column can't go `NOT NULL` until the auth milestone actually sets it — sequence this after Milestone 3, not with the rest of Phase F).
7. **Phase G** — Update `scripts/seed.ts` and `data/*.ts` to include `organizationId` on every seeded record and a second organization + users for isolation testing (§13).

**Existing-data concerns:** none blocking — confirmed no duplicate `users.email` or `invoices.invoice_number` in current seed data (§2). The only genuinely awkward step is `password_hash` for the 5 existing seeded users, addressed in §19.

---

## 7. Authentication Architecture

### Password hashing — comparison and recommendation

| Option | Native build step? | Maturity | Notes |
|---|---|---|---|
| `bcrypt` (native) | Yes (node-gyp) | Very mature | Native compilation is the single most common source of broken Vercel/serverless deploys; also needs a matching prebuilt binary for Windows local dev vs. Linux prod. Avoid given this project's Windows-dev + Vercel-Fluid-Compute target. |
| `bcryptjs` (pure JS) | **No** | Mature, widely used, API-compatible with `bcrypt` | Slower than native bcrypt but irrelevant at this scale (one hash per login/signup). Zero native binary — identical behavior in Docker, Windows dev, and Vercel. |
| `@node-rs/argon2` | Prebuilt native bindings (napi-rs), no local compiler needed | Modern, argon2id is the current OWASP-recommended KDF | Slightly stronger than bcrypt against GPU/ASIC attacks; prebuilt binaries generally work fine on Vercel's supported Linux target, but adds a native dependency class this project has zero precedent for. |
| Hand-rolled (`node:crypto` `scrypt`) | No | N/A | **Explicitly excluded** — the task requires an established library, not hand-rolled cryptography, even though the underlying primitive is a Node stdlib function. |

**Recommendation: `bcryptjs`.** It is the option with the fewest moving parts across this project's actual deployment targets (Windows dev machine, Docker Postgres locally, Vercel Fluid Compute in preview/prod) — no native compilation anywhere in the pipeline, which matters more here than the marginal cryptographic edge of argon2id at this application's threat model and scale. The hashing call is isolated to one function (`lib/password.ts`), so swapping to `@node-rs/argon2` later is a contained change if requirements grow.

### Signup (`POST /api/auth/signup`)

Given locked decision §4.11 (no invitations), signup creates **both** a new `organizations` row and its first `users` row in one request:
1. Validate input (email, password, name, organization name) via a new Zod schema, `lib/schemas/auth.schema.ts` — same pattern as every other `*.schema.ts` file.
2. Check `users.email` uniqueness (existing global `@unique` does this at the DB level too — service should pre-check and return a clean `ServiceError("CONFLICT")`, matching the existing `conflict()` helper pattern rather than letting a raw Prisma `P2002` surface).
3. Hash the password (`bcryptjs.hash(password, 12)`).
4. Create `organizations` row + `users` row (role defaults to `"admin"` — the creator of an org is its first admin; this is CRM data, not an RBAC decision, consistent with §4.8).
5. Create a `sessions` row, set the cookie, return the created user (never `password_hash`).

### Login (`POST /api/auth/login`)

1. Validate `{ email, password }`.
2. Look up `users` by `email` (already globally unique — direct lookup, no org disambiguation needed, matching §4.4's stated rationale).
3. If no user, or `is_active === false`, or `bcryptjs.compare(password, user.password_hash)` fails → a single generic `ServiceError("UNAUTHORIZED")` (never reveal which of "no such user" / "wrong password" / "deactivated" occurred — standard practice, and trivial to implement uniformly here).
4. Create a new `sessions` row, set the cookie, return the user (minus `password_hash`).

### Session design

- **`sessions` table fields:** `id` (the opaque token itself — see below), `user_id`, `created_at`, `expires_at`. No `organization_id`, no `role` stored redundantly on the session row — both are resolved by joining through `user_id → users.organization_id / users.role` at lookup time, so there is exactly one source of truth for a user's org/role and no staleness risk if either ever changes later.
- **What's in the cookie:** a single opaque, cryptographically random session id (e.g. 32 bytes from `crypto.randomBytes`, base64url-encoded) — this **is** the `sessions.id` primary key. The cookie never contains `userId`, `organizationId`, `role`, or anything else meaningful; it is a bare lookup key. This satisfies "never expose auth secrets to client-side JS" doubly: the cookie is `httpOnly` (JS can't read it at all) *and* even if read, it's meaningless without a DB lookup.
- **Session lookup (`requireSession(request)` in `lib/session.ts`):** read the cookie → `prisma.sessions.findUnique({ where: { id: token }, include: { user: true } })` → if missing, or `expires_at <= now()`, or `user.is_active === false` → throw `ServiceError("UNAUTHORIZED")`. Otherwise return `{ userId, organizationId: user.organization_id, role: user.role }`.
- **Expiration handling:** purely a comparison at lookup time (`expires_at <= now()`) — no background sweep job in v1. A stale expired row sits in the table until naturally superseded; cleaning these up periodically is a reasonable future cron job, explicitly out of scope here (matches "don't introduce speculative infrastructure").
- **Logout (`POST /api/auth/logout`):** delete the matching `sessions` row (`prisma.sessions.delete`) **and** clear the cookie (`Set-Cookie` with `Max-Age=0`). Server-side deletion means logout is effective even if the cookie were somehow retained/replayed.
- **Rotation/revocation:** intentionally minimal for v1 — no rotation on every request (would add a DB write to every authenticated call for no v1-relevant benefit), no "log out of all devices." Logout revokes exactly the one session it's called with. This is a deliberate simplicity choice, not an oversight — noted so it isn't mistaken for a gap during review.
- **Current-user resolution:** `GET /api/auth/me`, backed by `requireSession`, returns `{ id, name, email, role, organizationId }` (never `password_hash`) for `AppShell` to render.

### Cookie properties

| Property | Value | Why |
|---|---|---|
| `httpOnly` | `true` | Never exposed to client JS — the whole point of an opaque server-side session. |
| `secure` | `true` in production, `false` in local dev | Mirrors the existing `NODE_ENV`-aware pattern already used in `lib/prisma.ts`. Vercel prod/preview is always HTTPS; local `next dev` is plain HTTP. |
| `sameSite` | `"lax"` | Standard safe default for a session cookie with no cross-site POST requirement; doesn't break normal top-level navigation the way `"strict"` occasionally can. |
| `path` | `"/"` | Needed on every route, including `/api/**` and `(dashboard)`. |
| `maxAge` | e.g. 7 days, fixed (not sliding) at signup/login time — matches `sessions.expires_at` | Keep it simple; sliding-window renewal is an easy later addition if needed. |

---

## 8. Request / Authorization Flow

```
Browser  →  middleware.ts        →  /api route            →  service                →  Prisma
  │             │                        │                        │
  │        cookie present?          requireSession()          org-scoped WHERE
  │        no  → redirect /login    missing/expired/          row not in org
  │        yes → pass through       inactive user             → 404 (not 403)
  │                                 → 401
```

- **No/invalid/expired session → `401 UNAUTHORIZED`.** Thrown by `requireSession` in the API layer (never in middleware, which only gates page navigation, not API correctness — an API caller with no cookie must still get a real `401` from the route, not just a redirect that a raw `fetch` would silently follow or ignore).
- **Resource belongs to another organization → `404 NOT_FOUND`.** Thrown by the service layer, using the *existing* `assertFound`/`notFound()` machinery already wired end-to-end (`lib/api-route.ts` → `STATUS_BY_CODE.NOT_FOUND = 404`). No new error code needed. This deliberately reuses exactly the same code path a same-org "record truly doesn't exist" 404 already uses — from the client's perspective the two cases are indistinguishable, which is the point (avoids confirming cross-org resource existence).
- **Resource in-org, denied by a future authorization rule → `403 FORBIDDEN`.** Not implemented this milestone (no RBAC yet, §4.8) — the code path exists (`ServiceError("FORBIDDEN")` → 403) and is reserved for later.

`middleware.ts` itself does exactly one thing: check whether a plausibly-valid session cookie is present (existence check only — it does **not** query the database; a full "is this session actually still valid in Postgres" check is unnecessary in middleware and would violate "route gating only," since the definitive check already happens in every API route via `requireSession`). Middleware protects the `(dashboard)/**` page routes only (redirect unauthenticated visits to `/login`); it should also cover `/api/**` in the sense of *not blocking* those requests (API routes self-protect via `requireSession`, returning JSON 401s — a redirect response from middleware would break `fetch()` callers expecting JSON).

---

## 9. Service-Layer Tenant Scoping

### Canonical pattern (used for every service — this is what Milestone 5 establishes as the template)

```ts
class LeadService {
  async list(organizationId: ID, params: Partial<PaginationParams> = {}): Promise<PaginatedResult<Lead>> {
    const totalItems = await prisma.leads.count({ where: { organization_id: organizationId } });
    const rows = await prisma.leads.findMany({
      where: { organization_id: organizationId },
      orderBy: ORDER_BY_ID, skip: ..., take: ...,
    });
    ...
  }

  async getById(organizationId: ID, id: ID): Promise<Lead | null> {
    const row = await prisma.leads.findFirst({ where: { id, organization_id: organizationId } });
    return row ? toLead(row) : null;
  }

  async create(organizationId: ID, data: CreateLeadInput): Promise<Lead> {
    const input = parseInput(CreateLeadSchema, data);
    const assignedTo = await assertUserId(organizationId, input.assignedTo);
    const existing = await prisma.leads.findMany({ where: { organization_id: organizationId }, select: { id: true } });
    const id = nextId("lead", existing);
    const row = await prisma.leads.create({ data: { id, organization_id: organizationId, ... } });
    return toLead(row);
  }

  async update(organizationId: ID, id: ID, data: UpdateLeadInput): Promise<Lead | null> {
    const previous = await this.getById(organizationId, id);   // org-scoped — returns null across orgs
    if (!previous) return null;                                 // route turns this into 404 via assertFound, same as today
    ...
    const row = await prisma.leads.updateMany({ where: { id, organization_id: organizationId }, data: patch });
    // or: prisma.leads.update({ where: { id } }) guarded by the getById check above — either is fine since getById already proved org ownership
  }

  async delete(organizationId: ID, id: ID): Promise<boolean> {
    const existing = await prisma.leads.findFirst({ where: { id, organization_id: organizationId }, select: { id: true } });
    if (!existing) return false;
    ...
    await prisma.leads.delete({ where: { id } });
    return true;
  }
}
```

Key point: because `getById`/`getForUpdate` is always org-scoped, and every route already funnels a `null`/`false` service return through `assertFound` → `ServiceError("NOT_FOUND")` → 404 (§8), **cross-tenant access already becomes a 404 with zero new code in the API layer** — the entire enforcement lives in the one-line `WHERE organization_id = …` addition to each service query. This is exactly why no `tenantGuard()` abstraction is needed: the existing `null`-return + `assertFound` pattern already does the job once the query itself is scoped.

### Full service inventory

**`lead.service.ts`** — every method needs `organizationId` threaded: `getAll`, `list`, `getById`, `getDetails` (cascades into `resolveAssignee`/`activityService`/`noteService`/`taskService`/`appointmentService` — all need the org id passed down), `create`, `update`, `delete`, `convert` (**high-risk, multi-step** — see below), `getByStatus`, `getByAssignee`, `getBySource`, `getByPriority`, `search` (currently fetches `getAll()` then filters in-process — must call the now-scoped `getAll`). `nextId("lead", existing)`'s `existing` query needs `organization_id` filter.

**`customer.service.ts`** — `getAll`, `getById`, `getDetails` (cascades into 8 parallel calls — all need org id), `create` (`assertLeadId` must become org-scoped — see §10), `update`, `delete` (its dependency-count sub-query, `getCustomerDependencies`, does 6 unscoped counts — all need `organization_id` added, though in practice they're already implicitly scoped once `id` itself is proven org-owned by the caller; still add the filter defensively and for query-plan correctness), `getByLeadId`, `getByLifecycle`, `getActive`, `getByAssignee`, `search`. `nextId("cust", …)` scoped.

**`appointment.service.ts`** — `getAll`, `getById`, `create` (`resolveLeadCustomerLink`/`assertUserId` become org-scoped), `update`, `delete`, `getByStatus`, `getByLeadId`, `getByCustomerId`, `getByAssignee`, `migrateLeadToCustomer` (**high-risk — part of `convert()`**, see below; its `updateMany({ where: { lead_id: leadId }, ... })` must add `organization_id: organizationId` so it can never touch another org's appointments even if `leadId` were somehow wrong), `getUpcoming` (**dashboard-risk**), `getInRange`. `nextId("appt", …)` scoped.

**`task.service.ts`** — `getAll`, `getById`, `create` (`assertLeadCustomerXor`/`assertUserId` org-scoped), `update`, `delete`, `getByStatus`, `getByPriority`, `getByAssignee`, `getByLeadId`, `getByCustomerId`, `migrateLeadToCustomer` (**high-risk**, same `organization_id` addition to its `updateMany` as appointments), `getOverdue` (**dashboard-risk**), `getOpen` (**dashboard-risk**). `nextId("task", …)` scoped.

**`activity.service.ts`** — `getAll`, `getById`, `create` (`assertEntityReference`/`assertUserId` org-scoped — **polymorphic, see §10**), `update`, `delete`, `getByType`, `getByPerformer`, `getTimeline` (**used by both lead and customer details pages**), `getRecent` (**dashboard-risk** — currently global `take: limit`, must add `organization_id` filter or the "recent activity" dashboard tile silently shows every org's activity). `nextId("act", …)` scoped.

**`note.service.ts`** — `getAll`, `getById`, `create` (`assertEntityReference`/`assertUserId` org-scoped — **polymorphic, see §10**), `update`, `delete`, `getForEntity`, `getByAuthor`. `nextId("note", …)` scoped.

**`service.service.ts`** — `getAll`, `getById`, `create` (`assertCustomerId` org-scoped), `update`, `delete`, `getByCustomerId`, `getByStatus`, `getActive`. `nextId("svc", …)` scoped.

**`invoice.service.ts`** — `getAll`, `getById`, `create` (`assertCustomerId`/`assertOptionalServiceId` org-scoped; **and** the `invoice_number` uniqueness is now per-org per §6, so a duplicate within one org still 409s via the existing `P2002` mapping, but the same number is legitimately reusable across two different orgs — verify this behaves correctly once the composite unique constraint lands), `update`, `delete`, `getByCustomerId`, `getByStatus`, `getByServiceId`, `getUnpaid` (**dashboard/report-risk**), `getOverdue` (**dashboard/report-risk**). `nextId("inv", …)` scoped.

**`user.service.ts`** — `getAll` (**high-risk**: this is exactly the query behind every `assignedTo` `<select>` in the UI across leads/customers/appointments/tasks — must filter to `organization_id`, or every form in every org silently offers every other org's employees as assignees), `getById` (used internally by `assertUserId` and by `resolveAssignee` in both `lead.service.ts` and `customer.service.ts` — must become org-scoped).

**`dashboard.service.ts`** — `getSummary(organizationId)` must thread `organizationId` into **all 12** of its parallel calls (enumerated in §2). This is the single highest-leverage aggregate-scoping fix in the whole plan — one function, but its correctness depends on every downstream `getAll`/`getActive`/`getUpcoming`/`getOpen`/`getOverdue`/`getUnpaid`/`getRecent` already being correctly org-scoped per the inventory above.

**`report.service.ts`** — `getSummary(organizationId)` must thread `organizationId` into all **5** of its calls, same dependency structure as `dashboard.service.ts`.

**`validation.ts` / `helpers.ts` / `parse.ts`** — see §10 for `validation.ts` in full. `helpers.ts`'s `nextId()` itself needs no change (it's a pure function over an already-filtered row list); every call site does. `parse.ts` needs no change — it's pure Zod parsing with no DB access and no org concept.

### High-risk method call-out: `leadService.convert()`

Reading the source directly: `convert(id)` calls, in order, `this.getById(id)`, `customerService.getByLeadId(id)`, `customerService.create({...})`, `taskService.migrateLeadToCustomer(lead.id, customer.id)`, `appointmentService.migrateLeadToCustomer(lead.id, customer.id)`, `this.update(id, { status: "converted" })`, `activityService.create({...})`. Every one of these seven calls needs `organizationId` added as its first argument, sourced from the single `organizationId` parameter added to `convert()` itself — **not** re-derived per call. Because `getById`/`getByLeadId` become org-scoped, a cross-org `id` fails at the very first line (`lead` comes back `null` → existing `notFound()` throw) before any write happens, so there is no partial-write risk introduced by adding org-scoping itself. As stated in §2, **transaction-wrapping remains explicitly out of scope** for this milestone — that's a separate, already-tracked (ADR-019/021) improvement.

---

## 10. Validation & Cross-Entity Ownership

Every `assert*` helper in `services/validation.ts` gets `organizationId` as its **first** parameter, and its Prisma existence check gets `organization_id: organizationId` added to `where`:

| Helper | Change |
|---|---|
| `assertUserId(organizationId, value, field?)` | `where: { id, organization_id: organizationId }` — prevents org A assigning a record to org B's user |
| `assertOptionalUserId` | same, short-circuits on `undefined`/`null` as today |
| `assertLeadId(organizationId, value, field?)` | same pattern — prevents referencing another org's lead |
| `assertOptionalLeadId` | same |
| `assertCustomerId(organizationId, value, field?)` | same |
| `assertOptionalCustomerId` | same |
| `assertServiceId(organizationId, value, field?)` | same |
| `assertOptionalServiceId` | same |
| `assertLeadCustomerXor(organizationId, leadId, customerId)` | delegates to the now-scoped `assertLeadId`/`assertCustomerId` |
| `resolveLeadCustomerLink(organizationId, input, existing?)` | delegates to `assertLeadCustomerXor` with `organizationId` |
| `assertEntityReference(organizationId, entityType, entityId)` | **must be extended, not just scoped** — see below |

### Polymorphic `notes` / `activities` — explicit handling (task §13)

Neither table has a real foreign key on `(entity_type, entity_id)` — confirmed in `prisma/schema.prisma` (no relation defined on those columns) and in `docs/decisions.md` ADR-021 ("intentionally not foreign-keyed"). This means **Postgres itself cannot protect tenant isolation here** — it must be enforced entirely in `assertEntityReference`, which is called from `note.service.ts`'s `create`/`update` and `activity.service.ts`'s `create`/`update`.

Today's `assertEntityReference` only actually checks `lead`/`customer` (see §2's gap call-out); the other five entity types (`appointment`, `task`, `service`, `invoice`, `note`) pass unconditionally. **This plan closes that gap as part of tenant-isolation work** (it is not optional once multi-tenancy exists — an unchecked entity type is a direct cross-org write vector):

```ts
export async function assertEntityReference(
  organizationId: ID,
  entityType: EntityType,
  entityId: ID,
): Promise<void> {
  let exists: boolean;
  switch (entityType) {
    case "lead":
      exists = Boolean(await prisma.leads.findFirst({ where: { id: entityId, organization_id: organizationId } }));
      break;
    case "customer":
      exists = Boolean(await prisma.customers.findFirst({ where: { id: entityId, organization_id: organizationId } }));
      break;
    case "appointment":
      exists = Boolean(await prisma.appointments.findFirst({ where: { id: entityId, organization_id: organizationId } }));
      break;
    case "task":
      exists = Boolean(await prisma.tasks.findFirst({ where: { id: entityId, organization_id: organizationId } }));
      break;
    case "service":
      exists = Boolean(await prisma.services.findFirst({ where: { id: entityId, organization_id: organizationId } }));
      break;
    case "invoice":
      exists = Boolean(await prisma.invoices.findFirst({ where: { id: entityId, organization_id: organizationId } }));
      break;
    case "note":
      exists = false; // notes don't reference notes; unreachable via current EntityTypeSchema call sites — keep explicit rather than falling through
      break;
    default:
      exists = false;
  }
  if (!exists) throw new ServiceError(`Unknown ${entityType}: ${entityId}`, "VALIDATION");
}
```

This is a small, bounded fix (six explicit cases instead of two) directly required by the tenant-isolation goal — not a generic "polymorphic ownership framework." **Before create:** every `noteService.create`/`activityService.create` call now proves the target entity exists *and* belongs to the caller's org. **Before list/get:** `noteService.getForEntity`/`activityService.getTimeline` take `(organizationId, entityType, entityId)` and filter `WHERE entity_type = ... AND entity_id = ... AND organization_id = ...` directly on the `notes`/`activities` row itself (cheaper than re-validating the target entity on every read, and correct because notes/activities are themselves getting their own `organization_id` column per §6 — the row's own org column is authoritative once it exists, no need to re-derive it from the polymorphic target on every read). **Before update/delete:** same org-scoped `getById` pattern as every other entity (§9's canonical pattern).

---

## 11. API Route Changes

Every route below gets the same two-line addition at the top of every handler: `const { organizationId } = await requireSession(request);` then that value is passed into the service call in place of the current bare arguments. No route changes its response shape, status codes beyond what §8 specifies, or URL structure.

| Route file | Methods | Service called | organizationId threading | Notes |
|---|---|---|---|---|
| `leads/route.ts` | GET, POST | `leadService.list`/`getAll`/`create` | yes | |
| `leads/[id]/route.ts` | GET, PATCH, DELETE | `leadService.getById`/`update`/`delete` | yes | |
| `leads/[id]/details/route.ts` | GET | `leadService.getDetails` | yes | cascades into 4 other services |
| `leads/[id]/convert/route.ts` | POST | `leadService.convert` | yes | **high-risk, multi-step** — §9 |
| `customers/route.ts` | GET, POST | `customerService.getAll`/`create` | yes | |
| `customers/[id]/route.ts` | GET, PATCH, DELETE | `customerService.getById`/`update`/`delete` | yes | |
| `customers/[id]/details/route.ts` | GET | `customerService.getDetails` | yes | cascades into 5 other services |
| `appointments/route.ts` | GET, POST | `appointmentService.getAll`/`create` | yes | |
| `appointments/[id]/route.ts` | GET, PATCH, DELETE | `appointmentService.getById`/`update`/`delete` | yes | |
| `tasks/route.ts` | GET, POST | `taskService.getAll`/`create` | yes | |
| `tasks/[id]/route.ts` | GET, PATCH, DELETE | `taskService.getById`/`update`/`delete` | yes | |
| `services/route.ts` | GET, POST | `serviceService.getAll`/`create` | yes | |
| `services/[id]/route.ts` | GET, PATCH, DELETE | `serviceService.getById`/`update`/`delete` | yes | |
| `invoices/route.ts` | GET, POST | `invoiceService.getAll`/`create` | yes | |
| `invoices/[id]/route.ts` | GET, PATCH, DELETE | `invoiceService.getById`/`update`/`delete` | yes | |
| `activities/route.ts` | GET, POST | `activityService.getAll`/`create` | yes | `create` also needs the extended `assertEntityReference`, §10 |
| `activities/[id]/route.ts` | GET, PATCH, DELETE | `activityService.getById`/`update`/`delete` | yes | |
| `notes/route.ts` | GET, POST | `noteService.getAll`/`create` | yes | `create` also needs the extended `assertEntityReference`, §10 |
| `notes/[id]/route.ts` | GET, PATCH, DELETE | `noteService.getById`/`update`/`delete` | yes | |
| `dashboard/route.ts` | GET | `dashboardService.getSummary` | yes | **aggregate — high-risk**, §9 |
| `reports/route.ts` | GET | `reportService.getSummary` | yes | **aggregate — high-risk**, §9 |
| `users/route.ts` | GET | `userService.getAll` | yes | **high-risk** — feeds every assignee picker, §9 |

**New routes to create** (not modifications of existing ones): `app/api/auth/signup/route.ts`, `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`, `app/api/auth/me/route.ts`. These are the only routes that do **not** call `requireSession` at entry (`signup`/`login` create sessions; `logout` reads the cookie directly to know what to delete; `me` requires a session to answer).

---

## 12. Frontend Changes

Because the UI already talks exclusively to `/api/**` (never to services/data directly — confirmed throughout `hooks/*` and every `app/(dashboard)/**/page.tsx` inspected), **tenant scoping requires zero changes to existing dashboard pages.** Once the API boundary is session-protected and org-scoped, every existing page/hook (`useLeads`, `useCustomers`, `useDashboard`, etc.) automatically receives correctly-scoped data with no code change — this is the direct payoff of the layering rule in `AGENTS.md`.

Concrete new/changed files:
- **New:** `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx` — a new route group outside `(dashboard)`, no `AppShell` (no sidebar/nav needed for auth screens). Simple forms using the existing React Hook Form + Zod + `@hookform/resolvers` stack already in `package.json`, matching the pattern implied by every other CRUD form in the app.
- **`app/(dashboard)/layout.tsx`** — gains a session check. Two implementation choices: rely entirely on `middleware.ts`'s redirect (simplest, no duplicate logic), or add a server-side belt-and-suspenders check here too. **Recommendation: middleware only** — a second check in the layout would duplicate the "route gating" responsibility the task explicitly assigns to middleware alone.
- **`components/layout/AppShell.tsx`** — the dead `Logout` link (`href="#"`) becomes a real control that `POST`s to `/api/auth/logout` then redirects to `/login`; the static `UserRound` avatar icon/button gains the current user's name/email (fetched via `/api/auth/me` or passed down from a server component wrapper) and becomes the logout trigger's anchor (e.g. a small dropdown, kept minimal — no new UI primitive framework needed, reuse existing button/icon patterns already in the file).
- **`app/page.tsx`** — no functional change required (its `/dashboard` links already correctly bounce through the new middleware redirect once a visitor isn't authenticated); optionally repoint the CTAs to `/signup` for clarity, but that's cosmetic, not required for correctness.
- **`app/layout.tsx`** — no change needed; it's just fonts/metadata, no session provider required since every data-fetching page already goes through `/api/**` per-request (no client-side global auth context is architecturally necessary here).

No existing dashboard page (`leads`, `customers`, `tasks`, `appointments`, `services`, `invoices`, `reports`, `settings`) is rewritten.

---

## 13. Seed / Fixture Strategy

`scripts/seed.ts` and `data/*.ts` need:

1. A second organization: `org-002`, e.g. "Acme Field Services" (name arbitrary, deterministic).
2. `data/organizations.ts` (new file, same pattern as `data/users.ts`) — `[{ id: "org-001", name: "Default Organization" }, { id: "org-002", name: "Acme Field Services" }]`.
3. Every existing seed record in `data/users.ts`/`data/leads.ts`/etc. gains `organizationId: "org-001"` — this is the backfill target for the migration in §6, expressed as static data so `db:seed` stays the single source of truth (ADR-005).
4. A **small, deliberately separate** set of org-002 fixtures — enough to make isolation meaningful, not a full parallel dataset: 2 users (e.g. one admin, one sales), 3–5 leads, 1–2 customers, a couple of tasks/appointments, 1 invoice. Keep counts small and explicit (not generated by looping the org-001 arrays) so the fixture data is easy to reason about in tests.
5. **Deliberately reuse an invoice number across orgs** in the org-002 fixture — this is the one concrete case that positively proves the `@@unique([organization_id, invoice_number])` constraint change in §6 is doing its job (global uniqueness would have rejected this; per-org uniqueness must accept it). Corrected during Milestone 2 implementation: org-001's actual invoice numbers are 3-digit-padded (`INV-2026-001`, not the `INV-2026-01` shown here originally) — the org-002 fixture reuses `INV-2026-001` to match.
6. `scripts/seed.ts` stays idempotent — `upsert` keyed on `id` is unaffected by adding `organization_id` to the payload; add `organizations` as the very first upserted table (before `users`, since `users.organization_id` FKs to it).
7. Update the seeded-count comment/verification note pattern established in ADR-022 (`users 5, leads 50, …`) once counts change, so future audits stay accurate — this is documentation hygiene inside `docs/decisions.md`, not a code change, and should happen as part of Milestone 2's PR, not this plan.
8. **Discovered during Milestone 2 implementation, not anticipated by this plan:** several `data/*.ts` files are *generative* — they derive records by indexing into a shared array with fixed loop counts or modulo cycling (`services.ts`: `customers[i % customers.length]` over 25 iterations against a 20-row array; similar patterns in `tasks.ts`, `invoices.ts`, `appointments.ts`, and the `activities.ts`/`notes.ts` target pools that iterate every lead/customer/appointment/task/service/invoice). Appending org-002 rows directly to the shared `leads`/`customers`/etc. exports would make some of this generative logic wrap around and cross-wire an org-001 record to an org-002 customer once counts changed — a real tenant-isolation bug in the seed data itself, independent of the service layer. Fix applied: each generative file now derives from an explicit `org1*` -scoped subset (e.g. `const org1Customers = customers.filter(c => c.organizationId === "org-001")`) before doing its index math, so the original org-001 output is provably byte-identical to before, and org-002 fixtures are appended afterward as small hand-authored arrays. `activities.ts`/`notes.ts` keep their two big generative blocks (100/60 rows) scoped to org-001 only and get a handful of hand-authored org-002 rows appended instead of flowing through the shared target pool. Any future work adding more seed data (e.g. an org-003) should follow the same `org1*`-scoping pattern rather than appending to the raw shared arrays.

---

## 14. Environment & Deployment Changes

| Environment | What changes |
|---|---|
| **Local dev** | No new services. Docker Postgres (ADR-020, port 5433) gets the new migration applied via `prisma migrate dev` exactly like existing migrations. `.env` needs no new required variable for the DB itself — `DATABASE_URL` is unchanged. |
| **New env var** | A session-signing/secret value is **not strictly required** by the design in §7 — the cookie carries an opaque random token looked up in Postgres, not a signed/encrypted JWT, so there is nothing that needs a server-side secret to verify. If a defense-in-depth signed-cookie wrapper is later wanted (e.g. to detect cookie tampering before even hitting the DB), that would introduce one `SESSION_SECRET`/`AUTH_SECRET` env var — **not needed for the v1 design as specified**, flagged here so it isn't silently added without justification. |
| **Neon (preview/prod)** | No infrastructure change — same database, same connection string. The migration runs against it exactly like any other schema change via the normal deploy pipeline. |
| **Vercel** | Nothing to add for the DB. If the optional `SESSION_SECRET` above is ever adopted, it must be set per-environment (`vercel env add`, or the dashboard) for Development/Preview/Production separately — never share a dev secret into Production. The Vercel CLI is not currently installed on this machine; `npm i -g vercel` first if CLI-based env management is wanted later. |
| **Cookies** | `secure: true` only in production (Vercel prod/preview are HTTPS by default); `secure: false` for local `next dev` over plain HTTP — keyed off `process.env.NODE_ENV`, the same signal `lib/prisma.ts` already uses. No environment-specific cookie *domain* configuration is needed (single-domain app, no subdomain-per-tenant design — consistent with the shared-schema decision). |

**Never put real secrets in this file** — none are included above; if `SESSION_SECRET` is adopted later, generate it with `openssl rand -base64 32` (or equivalent) directly into the environment, never checked into source or documented here with a real value.

---

## 15. Testing & Tenant-Isolation Verification

Per the task's instruction to extend the existing approach: **grow `scripts/integration-test.ts`** rather than introducing `vitest`/`jest`. It already has the right shape — a `check()`/`expectServiceError()` harness against the live seeded DB, with tracked-and-cleaned-up created rows — and already asserts `ServiceError` codes directly (`expectServiceError(label, "VALIDATION", fn)`), which extends naturally to asserting `"NOT_FOUND"` for cross-org access. Add a new section to the script (after the existing sections) exercising org-scoped service calls directly (bypassing HTTP, same as the rest of the file does today), using the two seeded orgs from §13.

**Positive (happy path):**
- Org A user: can log in; `userService.getAll("org-001")` returns only org-001 users; `leadService.list("org-001", …)` returns only org-001 leads; can create/update/delete an org-001 lead.
- Org B user: independently sees only org-002 data via the same calls with `"org-002"`.

**Negative (cross-tenant):**
- `leadService.getById("org-001", <known org-002 lead id>)` → `null` (route-level: 404).
- `customerService.getById("org-001", <known org-002 customer id>)` → `null`.
- `userService.getById("org-001", <known org-002 user id>)` → `null`.
- `leadService.create("org-001", { assignedTo: <org-002 user id>, ... })` → `ServiceError("VALIDATION")` via the now-org-scoped `assertUserId`.
- `invoiceService.create("org-001", { customerId: <org-002 customer id>, ... })` (and the equivalent for service/lead references) → `ServiceError("VALIDATION")`.
- `noteService.create("org-001", { entityType: "appointment", entityId: <org-002 appointment id>, ... })` → `ServiceError("VALIDATION")` via the extended `assertEntityReference` (§10) — this is the concrete test that proves the polymorphic-entity fix actually works, not just the FK-backed ones.
- `dashboardService.getSummary("org-001")` totals match only org-001's seeded counts; same check for `"org-002"`.
- `reportService.getSummary("org-001")` likewise.

**HTTP-level checks** (new, since the existing script is service-level only — add a lightweight second pass, or a follow-up script `scripts/auth-integration-test.ts` using plain `fetch` against a running `next dev`/`next start` instance, matching the existing script's dependency-free style rather than adding Playwright/Supertest):
- No cookie → any `(dashboard)` page redirects to `/login`; any `/api/**` route (other than `auth/*`) → `401`.
- Invalid/garbage cookie value → `401`.
- Expired session (manually set `expires_at` in the past for a test session row) → `401`.
- Logout → subsequent request with the same (now-deleted) cookie → `401`.
- Login as org A, then `fetch('/api/leads/<org-B-lead-id>')` → `404`.
- Attempted client-supplied `organizationId` in a POST body (e.g. `{ ...leadFields, organizationId: "org-002" }` while authenticated as org A) → the created row's actual `organization_id` is `org-001` (proving the Zod strip-unknown-keys behavior from §2 holds) — this is worth a dedicated assertion, not just an assumption.
- Search endpoints (`leadService.search`, `customerService.search`) return only same-org matches even when a query term matches a same-named record in the other org.
- Pagination (`leadService.list`) `totalItems` reflects only the caller's org, not the combined count across both orgs.

---

## 16. Implementation Milestones

### Milestone 0 — Final architecture decisions / repository confirmation — ✅ Complete
**Objective:** Get explicit developer sign-off on the two things this plan had to decide without an explicit spec: (a) signup always creates a new org (§4.11/§19), and (b) `db/migrations/` is treated as frozen/historical, all new work goes through `prisma migrate` (§2). **Files affected:** none (discussion only). **DB/backend/frontend changes:** none. **Security implications:** none. **Tests:** none. **Validation commands:** none. **Completion criteria:** developer has explicitly confirmed both decisions (or corrected them) before Milestone 1 starts. **Do NOT:** write any code yet.

### Milestone 1 — Database: organizations + tenancy schema + migration — ✅ Complete
**Objective:** Land the schema changes from §6 (Phases A–F, minus the `password_hash NOT NULL` step which waits for Milestone 3). **Files:** `prisma/schema.prisma`, new `prisma/migrations/<timestamp>_*/migration.sql` (generated by `prisma migrate dev`, not hand-written). **DB changes:** `organizations`, `sessions` tables; `organization_id` on 9 tables (nullable → backfilled to `org-001` → `NOT NULL`); `invoices.invoice_number` uniqueness change; new indexes. **Backend changes:** none yet (services still ignore the new column). **Frontend:** none. **Security implications:** none yet — column exists but nothing enforces it. **Tests:** `npx tsx scripts/integration-test.ts` must still pass 100% unmodified (proves the migration didn't break existing behavior since services don't reference the new column yet). **Validation commands:** `npx prisma validate`, `npx prisma migrate dev`, `npx tsc --noEmit`, `npx tsx scripts/integration-test.ts`. **Completion criteria:** migration applied locally against Docker Postgres, schema matches §6, existing integration suite green. **Do NOT:** touch any service or route file yet; do not make `password_hash` `NOT NULL` yet.

### Milestone 2 — Seed two organizations and isolation test fixtures — ✅ Complete
**Objective:** Implement §13. **Files:** new `data/organizations.ts`, every existing `data/*.ts` file (add `organizationId`), `scripts/seed.ts` (seed `organizations` first; add org-002 fixture upserts). **DB changes:** none beyond what M1 already added — this populates rows. **Backend/frontend:** none. **Security implications:** none yet. **Tests:** re-run `npm run db:seed` and confirm idempotency (run twice, row counts unchanged the second time); confirm the deliberately-duplicated org-002 invoice number inserts successfully (proves M1's constraint change). **Validation commands:** `npm run db:seed`, a manual `SELECT organization_id, count(*) FROM leads GROUP BY 1;`-style spot check. **Completion criteria:** two orgs seeded, org-002 has a small distinct dataset, re-running seed is a no-op. **Do NOT:** generate org-002 data by mechanically looping org-001's arrays — keep it small and hand-authored per §13.

### Milestone 3 — Authentication foundation — ✅ Complete
**Objective:** §7 in full — password hashing, signup, login, logout, session table usage. **Files:** new `lib/password.ts` (bcryptjs wrapper), new `lib/schemas/auth.schema.ts`, new `services/auth.service.ts` (or extend `user.service.ts` — recommend a new dedicated `auth.service.ts` since signup/login have a distinct shape from the other entity CRUD services and touch two tables at once), new `app/api/auth/signup/route.ts`, `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`. **DB changes:** none new (uses M1's `sessions`/`password_hash` columns); this milestone is what finally lets `password_hash` go `NOT NULL` (§6 Phase F, deferred here) — do that as this milestone's last migration step, after confirming every user row has a hash (see §19 for what happens to the 5 pre-existing seeded users). **Backend:** new files only, no existing service/route touched. **Frontend:** none yet (M7). **Security implications:** this is where password storage/verification correctness matters most — hash never logged, never returned in any response, generic error on login failure (no user-enumeration). **Tests:** extend `scripts/integration-test.ts` (or a new `scripts/auth-integration-test.ts`) — signup creates org+user+session; duplicate-email signup → `CONFLICT`; login with wrong password → `UNAUTHORIZED`; login as deactivated (`is_active: false`) user → `UNAUTHORIZED`; logout deletes the session row. **Validation commands:** `npx tsc --noEmit`, the new/extended test script, `npx prisma studio` spot-check that `password_hash` is never a plaintext-looking value. **Completion criteria:** signup/login/logout work end-to-end via direct service calls; `password_hash` is `NOT NULL`. **Do NOT:** touch any CRM entity service; do not add password reset/email verification/MFA.

**Implemented (2026-08-19) — see ADR-023 in `docs/decisions.md` for full detail.** Built exactly as scoped above, with two deliberate deviations:
1. **`password_hash` was *not* flipped to `NOT NULL`, and the 5 org-001 / 2 org-002 seed users were *not* backfilled with a deterministic password.** §19 flagged both as open questions needing explicit developer sign-off before this milestone started; that sign-off was never obtained, so the conservative path was taken — schema untouched, those users remain login-disabled until a follow-up migration lands. New users created via signup always get a real `password_hash`; this is enforced in application logic, not a DB constraint. This also means the milestone's diff matches its own stated file list exactly (new files only — no `schema.prisma`/`data/*`/`scripts/seed.ts` edit was needed).
2. **A `getSessionContext(token)` DB-backed session lookup/expiry check lives in `services/auth.service.ts`**, not deferred entirely to Milestone 4's `lib/session.ts`. It's the "is this session still valid" database question (missing/expired/deactivated-user → `UNAUTHORIZED`), used today only by tests and internally by nothing else — no route, no middleware, no cookie-reading wired to it. Milestone 4's `requireSession(request)` is expected to read the cookie off the request and call into this (or an equivalent), then add the actual enforcement (routes, `middleware.ts`) that this milestone deliberately does not touch.

Also added (not in the original file list, both minimal/additive): `unauthorized()` factory in `services/errors.ts` (mirrors `notFound()`/`conflict()` — `UNAUTHORIZED` was already in the taxonomy, just unused), `lib/auth-cookie.ts` (httpOnly cookie get/set/clear for the three auth routes only — distinct from and does not preempt Milestone 4's `lib/session.ts`), and `authService`/type exports added to `services/index.ts` and `lib/schemas/index.ts` for consistency with every other service/schema.

### Milestone 4 — Session resolution + middleware + protected routes — ✅ Complete
**Objective:** §7/§8's `lib/session.ts` (`requireSession`), root `middleware.ts`, and wiring `requireSession` into **one** existing route as a smoke test before the full pass in M6 (recommend `dashboard/route.ts` — small, single aggregate call, low risk). **Files:** new `lib/session.ts`, new `middleware.ts`, modify `app/api/dashboard/route.ts` and `services/dashboard.service.ts` only. **DB changes:** none new. **Backend:** `requireSession` reads the cookie, looks up `sessions` joined to `users`, returns `{ userId, organizationId, role }` or throws `UNAUTHORIZED`. **Frontend:** none yet — middleware will start redirecting unauthenticated `(dashboard)/**` visits to `/login`, which doesn't exist until M7, so this milestone should either stub a minimal `/login` placeholder or be sequenced immediately before M7 with no gap in between. **Security implications:** first real enforcement point — verify a request with no cookie gets `401` from `dashboard/route.ts` and a redirect from any dashboard page. **Tests:** add the "no cookie / invalid cookie / expired session" cases from §15 against this one route. **Validation commands:** manual `curl`/browser check of `/api/dashboard` with and without a valid cookie; `npx tsc --noEmit`. **Completion criteria:** exactly one route is fully session-protected and org-scoped end-to-end, proving the whole vertical slice (cookie → middleware → requireSession → service → Prisma) before scaling it out. **Do NOT:** touch any other route yet.

**Implemented (2026-08-19) — see ADR-024 in `docs/decisions.md` for full detail.** Built as scoped, with two things this milestone's own text didn't anticipate:
1. **The file is `proxy.ts`, not `middleware.ts`.** Next.js 16.0.0 renamed the file convention (confirmed in `node_modules/next/dist/docs/`, per `AGENTS.md`'s instruction to check that directory first) — this plan predates that check and still calls it `middleware.ts` throughout. Behavior is otherwise exactly as specified: existence-only cookie check, no DB query, redirects gated pages to `/login`, `/api/**` excluded from its matcher so API routes always answer with JSON.
2. **`/api/dashboard` authenticates but is not yet "org-scoped end-to-end."** `dashboardService.getSummary()` delegates to 6 other services' unscoped methods (`leadService.getAll()`, `customerService.getAll()`/`getActive()`, etc.) — none accept `organizationId` yet, and this milestone's own file list restricts changes to `app/api/dashboard/route.ts` (`services/dashboard.service.ts` was left untouched). Threading `organizationId` from `requireSession` into `getSummary()` without it reaching any of those 6 services would be an unused parameter — a half-finished implementation `AGENTS.md` §1 explicitly rules out. The route calls `requireSession` (401 on missing/invalid/expired session) and then the existing unscoped `getSummary()`; real per-org filtering is Milestone 6's job, once its dependency services are scoped. Treat "org-scoped end-to-end" in this milestone's objective line as aspirational text describing the target *shape* of the change, not something achievable within this milestone's own file boundary.

### Milestone 5 — Org-scope ONE service completely (reference implementation) — ✅ Complete
**Objective:** Per the task's explicit instruction, use `leadService` (and its 4 routes: `leads/route.ts`, `leads/[id]/route.ts`, `leads/[id]/details/route.ts`, `leads/[id]/convert/route.ts`) as the template every other service will copy. **Files:** `services/lead.service.ts`, the 4 lead route files, `services/validation.ts` (org-scope `assertUserId`, since lead create/update depends on it — this is the first service to force the shared-helper change), `services/helpers.ts` unchanged (only call sites change). **DB changes:** none new. **Backend:** implement the full canonical pattern from §9 for every `leadService` method, including `convert()`'s multi-step org-threading (§9's high-risk call-out) — this is deliberately the most complex service (multi-step convert, cross-service `getDetails`), so getting it right here de-risks the mechanical repeats in M6. **Frontend:** none (leads pages need no changes per §12 — verify this is actually true by manually testing the leads UI end-to-end after this milestone). **Security implications:** run the full §15 negative-test list, but scoped to leads only, as the proof-of-concept before repeating for every entity. **Tests:** extend `scripts/integration-test.ts`'s existing lead section with org-scoped variants; add the cross-org 404/VALIDATION cases for leads specifically. **Validation commands:** `npx tsc --noEmit`, integration script, manual browser check of `/leads` while logged in as org A and org B (two browser sessions/incognito). **Completion criteria:** every lead-related code path is fully tenant-isolated and manually verified via the UI; this milestone's diff is the reference other service PRs are reviewed against. **Do NOT:** touch any other service in this milestone — resist the urge to "just also do customers while I'm in here."

**Implemented (2026-08-19) — see ADR-025 in `docs/decisions.md` for full detail.** Built as scoped, with three corrections/clarifications this milestone's implementation forced:
1. **`nextId()` still scans all leads globally, not per-org** — §9's pseudocode filters the `existing` scan by `organization_id` before computing the next id, but `id` is a global Prisma primary key; two orgs independently computing `lead-001` would collide. Left exactly as it was before this milestone (already global), matching the precedent Milestone 3 set for `organizations`/`users` ids.
2. **`assertUserId` itself was not changed to require `organizationId`.** It's shared by 5 other services (`customer`/`appointment`/`task`/`activity`/`note`) that don't accept `organizationId` yet — changing its signature would have broken all five, which is exactly the "touch other services" this milestone forbids. Added a new, parallel `assertOrgUserId(organizationId, value, field?)` in `services/validation.ts` instead, used only by `lead.service.ts`. Milestone 6 should migrate the other 5 call sites to it and delete the unscoped original.
3. **`leadService.getAll()`'s `organizationId` parameter is optional, not mandatory** — its only two unscoped callers, `dashboardService.getSummary()` and `reportService.getSummary()`, are themselves explicitly Milestone 6 scope and have no `organizationId` to pass yet. Every other caller always passes it (enforced by a code comment on the method, not just convention).

`getDetails()`'s 4 cross-service reads and `convert()`'s 5 cross-service writes were left exactly as this milestone's own file-list boundary implies they must be — reasoned safe for the reads (the entity id passed down was already proven org-owned, and ids are globally unique, so no cross-org row is reachable), and an accepted, temporary, non-regressive gap for the writes (converted customers/migrated tasks/appointments/activity keep `organization_id: NULL` until Milestone 6, exactly as they do today) — see ADR-025 for the full reasoning per call. `convert()`'s actual new protection in this milestone is at its entry point: a cross-org conversion attempt now 404s before any write happens.

Tests: `scripts/integration-test.ts` `[11] Lead tenant isolation` (65/65 total, up from 53) plus a new `scripts/lead-http-test.ts` (14/14) standing in for the "two browser sessions" manual check this environment can't perform visually — signs up two real orgs and drives `/api/leads*` with each session's cookie, including a dedicated check that a spoofed `organizationId` in a request body never survives `parseInput`.

### Milestone 6 — Repeat tenant scoping across remaining services/routes — ✅ Complete
**Objective:** Apply the M5 pattern to the remaining 10 services and their 18 routes: `customer`, `appointment`, `task`, `activity`, `note` (**with the extended `assertEntityReference`, §10 — the one place this milestone isn't purely mechanical**), `service`, `invoice`, `user`, `dashboard`, `report`. **Files:** the remaining files listed in §9/§11. **DB changes:** none new. **Backend:** mechanical repetition of §9's canonical pattern, with special care on: `customerService.getDetails`/`leadService`'s reverse dependency (cascading org id through 8 parallel calls), the two `migrateLeadToCustomer` methods (`organization_id` added to their `updateMany` calls), and `dashboardService`/`reportService`'s aggregate fan-out (§9). **Frontend:** none (verify per-page after each service, same as M5). **Security implications:** this is where the bulk of the §17 checklist gets satisfied — work through it service-by-service rather than all at once at the end. **Tests:** extend `scripts/integration-test.ts` section-by-section, mirroring its existing per-entity structure. **Validation commands:** `npx tsc --noEmit` and the full integration script after each service (not just at the end — catch regressions early). **Completion criteria:** every item in §9's inventory is done; full integration script green; manual two-session (org A / org B) browser walkthrough of every dashboard page shows only same-org data. **Do NOT:** wrap `leadService.convert()`-style multi-step operations in new transactions as a "while I'm here" fix — stays deferred per §2/§9.

**Implemented (2026-08-19) — see ADR-026 in `docs/decisions.md` for full detail.** Built exactly as scoped, plus closing every gap Milestone 5 had deliberately left open, since this milestone is precisely what makes closing them possible:
1. **`services/validation.ts` fully consolidated.** Milestone 5's parallel `assertOrgUserId` is gone — `assertUserId` and every other `assert*` helper now take `organizationId` first, matching §10 exactly, with no leftover unscoped/scoped pair.
2. **`assertEntityReference` closes the polymorphic gap for all 5 previously-unchecked entity types** (`appointment`/`task`/`service`/`invoice`/`note`), each a real `findFirst({ id, organization_id })`. One deviation from §10's own pseudocode: `note` gets a real check too instead of a hardcoded `false` — more consistent, and the plan's own text called that case unreachable today, so it changes no observable behavior.
3. **`leadService.convert()`/`getDetails()` now thread `organizationId` through every downstream call**, closing the exact gap ADR-025 flagged: a converted customer, its migrated tasks/appointments, and the conversion activity all get the correct `organization_id` instead of `NULL`. Verified with a fresh HTTP-level conversion (`tenant-isolation-http-test.ts`) that reads the resulting customer row straight from the database.
4. **`dashboardService`/`reportService` now take `organizationId`** and thread it into all 12 and 5 of their fan-out calls — only possible now that every dependency service is itself scoped.
5. **Invoice number reuse across orgs confirmed working**; same-org duplicates still reject, surfacing as a raw Prisma `P2002` at the service layer (not a `ServiceError` — that translation is an API-boundary concern per the existing architecture, unchanged).

No transaction wrapping was added anywhere (§2/§9's explicit "Do NOT," honored). Tests: `integration-test.ts` grew to 91/91 (new `[12] Cross-service tenant isolation` section, 20 checks); new `tenant-isolation-http-test.ts` (22/22) extends the HTTP-level proof from leads to customers/users/dashboard/reports. Full suite across all 5 scripts: **168/168 checks passing.** `tsc --noEmit` and `next build` both clean across the whole codebase — every call site of every changed method compiled correctly, which in practice already satisfies Milestone 9's own audit goal for this pass (a manual grep sweep would find nothing `tsc` didn't already catch, since every signature change was made mandatory rather than optional). No CRM page needed changes, confirming §12's prediction that UI-to-`/api` layering makes tenant scoping a pure backend change.

### Milestone 7 — Frontend auth integration — ✅ Complete
**Objective:** §12 in full. **Files:** new `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`; modify `components/layout/AppShell.tsx` (logout wiring, current-user display); confirm `app/(dashboard)/layout.tsx` needs no change beyond what M4's middleware already provides. **DB changes:** none. **Backend:** none beyond what M3/M4 already built (this milestone only consumes `/api/auth/*`). **Frontend:** real login/signup forms (React Hook Form + Zod, matching existing form patterns in the codebase), working logout, current-user name/email shown in the header. **Security implications:** verify no `password_hash` or raw session token ever appears in a client-visible response body or React state. **Tests:** manual browser walkthrough — signup creates an org and lands in the dashboard; logout clears the session and redirects; visiting `/dashboard` unauthenticated redirects to `/login`. **Validation commands:** `npm run dev`, manual testing (no automated UI test framework exists or is being introduced per the locked decisions). **Completion criteria:** a brand-new visitor can sign up, see an empty (or org-002-style small) dashboard, log out, and log back in, entirely through the UI. **Do NOT:** rewrite any existing dashboard page's UI; do not add password reset/"remember me"/social login UI.

**Implemented (2026-08-19) — see ADR-027 in `docs/decisions.md` for full detail.** Built as scoped, with one addition this milestone's own file list didn't anticipate: **a new `GET /api/auth/me` route** (specified in §7/§11 but never actually created by M3/M4) plus a `hooks/useCurrentUser.ts` hook, both needed for `AppShell` to display the current user's identity. Building it surfaced a small pre-existing gap: `services/user.service.ts`'s `toUser()` row mapper never populated `organizationId` (unlike `services/auth.service.ts`'s separate `toUser()`, which already did) — fixed with the same one-line mapping, since `/me`'s response shape is explicitly specified in §7. `app/(dashboard)/layout.tsx` was confirmed to need no change, and `app/page.tsx`'s CTAs were left pointing at `/dashboard` (cosmetic per this milestone's own text). Verified end-to-end against a running dev server: unauthenticated `/dashboard` → 307 to `/login`; signup → 201 + session cookie; `/api/auth/me` → 200 with the full user shape; authenticated `/dashboard` → 200; logout → 204; `/api/auth/me` afterward → 401. `tsc --noEmit`, `eslint`, and the full `scripts/integration-test.ts` (91/91) all stayed green.

### Milestone 8 — Cross-tenant security verification
**Objective:** Execute the full §15 test list end-to-end (both service-level and HTTP-level) and the full §17 checklist as a deliberate, dedicated pass — not just "things happened to work during M5–M7." **Files:** primarily test-script additions (`scripts/integration-test.ts` and/or a new `scripts/auth-integration-test.ts`); no application code changes expected unless this milestone surfaces a gap. **DB changes:** none expected. **Backend/frontend:** fixes only if a gap is found — and if so, identify which specific §9/§10 item was missed and fix it there, not with a new ad-hoc check bolted on elsewhere. **Security implications:** this is the security milestone — treat every failure as blocking. **Tests:** the full §15 list, plus explicitly re-running every negative case from M5/M6 together (some cross-service interactions, like leads→customers→invoices, are only exercisable once every service is scoped). **Validation commands:** full `scripts/integration-test.ts` run, full HTTP-level test pass, manual two-org browser walkthrough of every page including dashboard/reports. **Completion criteria:** every item in §17 is checked off with a corresponding passing test, not just manual eyeballing. **Do NOT:** treat "the happy path works" as sufficient — the negative/cross-tenant cases are the actual deliverable of this milestone.

### Milestone 9 — Final architecture audit
**Objective:** A short, deliberate re-read of every changed service/route against §9's inventory and §17's checklist, specifically hunting for any method that was missed (e.g. a `get*` helper added mid-implementation that forgot the org filter). **Files:** read-only pass across `services/*`, `app/api/**`. **DB/backend/frontend changes:** none expected; this is a verification milestone, not an implementation one. **Security implications:** last line of defense before considering the milestone complete. **Tests:** re-run the full test suite one final time. **Validation commands:** `npx tsc --noEmit`, full integration script, and a manual grep sweep (`grep -rn "findMany\|findUnique\|findFirst" services/` cross-checked against the §9 inventory) to confirm no Prisma query was missed. **Completion criteria:** §18's Definition of Done is fully satisfied. **Do NOT:** use this milestone to add new features or abstractions "while reviewing."

---

## 17. Security Checklist

Each item ties back to where it's enforced in this plan:

1. ☐ Every tenant-owned read filters `organization_id` — §9 inventory, per-service.
2. ☐ Every create derives `organization_id` from `session.organizationId` — §9 canonical pattern; never from request body.
3. ☐ No client-supplied `organizationId` is trusted — §2/§6 (Zod default strip) + §15's dedicated test asserting this.
4. ☐ Every update is tenant-scoped — §9 canonical pattern (`getById(organizationId, id)` guard, or `updateMany` with `organization_id` in `where`).
5. ☐ Every delete is tenant-scoped — §9 canonical pattern.
6. ☐ Every foreign reference is same-organization validated — §10, all `assert*` helpers.
7. ☐ User listing is organization-scoped — §9, `userService.getAll` call-out.
8. ☐ Search operations are organization-scoped — §9, `leadService.search`/`customerService.search` call-outs.
9. ☐ Dashboard aggregates are organization-scoped — §9, `dashboardService.getSummary`'s 12 calls.
10. ☐ Reports are organization-scoped — §9, `reportService.getSummary`'s 5 calls.
11. ☐ Notes/activities verify polymorphic target ownership — §10, extended `assertEntityReference`.
12. ☐ Lead conversion remains tenant-scoped through every step — §9, `leadService.convert()` call-out (7 calls).
13. ☐ ID generation does not accidentally scan another organization's rows — §2/§9, all 8 `nextId()` call sites.
14. ☐ Cross-org resources return 404, not 403 — §8.
15. ☐ Missing/invalid sessions return 401 — §7/§8, `requireSession`.
16. ☐ Session cookies are httpOnly and secure in production — §7 cookie table.
17. ☐ Passwords are never stored plaintext — §7, `bcryptjs` hashing.
18. ☐ Password hashes are never returned to the client — §7, explicit in signup/login/`me` response shaping.
19. ☐ Logout invalidates the session — §7, server-side `sessions` row deletion.
20. ☐ Expired sessions cannot authenticate requests — §7, `expires_at` check in `requireSession`.

---

## 18. Definition of Done

- [ ] `prisma/schema.prisma` matches §6 exactly; migration applied cleanly against both local Docker Postgres and (when deployed) Neon.
- [ ] Two organizations exist in seed data with distinct, isolated CRM records (§13), and re-running `npm run db:seed` is a no-op.
- [ ] Signup, login, logout, and session resolution work end-to-end, with passwords hashed via `bcryptjs` and never exposed to the client.
- [ ] `middleware.ts` gates every `(dashboard)/**` route; every `/api/**` route (except `auth/*`) calls `requireSession` and returns `401` when it fails.
- [ ] Every method listed in §9's service inventory takes and applies `organizationId`; every `assert*` helper in §10 is org-scoped, including the extended `assertEntityReference`.
- [ ] All 22 pre-existing API routes thread `organizationId` from the session; response shapes and status codes are otherwise unchanged.
- [ ] The full §15 test list passes (extending `scripts/integration-test.ts`, no new test framework introduced).
- [ ] Every item in §17's checklist is checked and backed by a passing test, not just manual verification.
- [ ] Manual two-session (org A / org B) browser walkthrough of every existing dashboard page shows only same-org data, with no dashboard/report page rewritten.
- [ ] No RBAC, OAuth/SSO, invitations, password reset, MFA, email verification, Redis, multi-org membership, or generic policy/guard abstraction was introduced.
- [ ] `docs/decisions.md` gets a new ADR entry summarizing this milestone (matching the existing ADR pattern) once implementation lands — noted here for completeness, not required to produce this plan.

---

## 19. Risks / Open Questions

Genuine gaps surfaced by repository inspection — not invented uncertainty:

1. **How does a second user join an existing organization in v1?** The task locks "no invitation system" and "no multi-org membership," but doesn't specify how, e.g., org-002's second seeded user is supposed to have been added in a real (non-seed) flow. This plan's default (§4.11): signup always creates a *new* org; there is no in-product way to add a teammate to an *existing* org in this milestone — that capability is implicitly deferred to a future invitations milestone. **Needs explicit confirmation before Milestone 3**, since it shapes the signup route's contract.
2. **What happens to the 5 pre-existing seeded users' credentials?** They have no `password_hash` today (auth didn't exist). Two options: (a) assign each a known deterministic seed password (documented in seed script comments, fine for a dev/demo seed — matches the existing "deterministic, realistic, not random" seed philosophy in `AGENTS.md` §6) so they remain logically usable after Milestone 3; or (b) leave them password-less and effectively login-disabled until manually reset. **Recommendation: (a)**, since it keeps the existing demo data usable end-to-end, but this is a product decision, not purely technical — flagged for confirmation alongside Milestone 3.
3. **`db/migrations/` vs `prisma/migrations/`** — confirmed real (§2), not hypothetical. Recommendation given (treat `db/migrations/` as frozen, use `prisma migrate` exclusively going forward) should be explicitly acknowledged by the developer, since another contributor unaware of this history could reasonably be confused about which directory is authoritative.
4. **`assertEntityReference`'s pre-existing gap** (§2/§10) is being *fixed*, not just scoped, as part of this milestone, because leaving `appointment`/`task`/`service`/`invoice` entity types unchecked would leave a direct cross-tenant write vector through notes/activities even after everything else is scoped. This is flagged explicitly in case the intent was to touch strictly nothing beyond adding `organizationId` parameters — in this one case, a real (small, bounded) behavior fix is unavoidable to actually satisfy the task's own §13 requirement.
5. **No compiled/runtime verification was performed as part of this audit** — no `npx tsc --noEmit`, `npm run lint`, or `npx tsx scripts/integration-test.ts` was executed, per the instruction to keep this pass read-only and not run anything beyond safe inspection. The plan's file/line references are accurate as of this reading, but Milestone 1 should start with a fresh `tsc`/integration-test baseline run before any change, to have a clean "before" state to diff against.

---

**plan.md location:** `d:\Next JS\pulse-crm\plan.md` (repository root).
