# Pulse CRM — Architectural Decisions

Decisions that are actually reflected in the codebase or `AGENTS.md`. Keep entries short; update when the code changes.

---

## ADR-001 — Layered architecture (types → data → services → API → UI)

**Decision:** Enforce a strict import boundary. Services own data access; API is thin; UI talks only over HTTP.

**Why:** Lets seed arrays be replaced by a database later without rewriting pages. Prevents business logic from leaking into route handlers or components.

**Where:** `AGENTS.md` §2; all `app/api/**` import `@/services`; hooks/components do not import `@/services` or `@/data`.

---

## ADR-002 — Lead and Customer are separate entities

**Decision:** Leads and customers are different types. A customer always references its source lead via `leadId`. Conversion is an explicit service/API operation.

**Why:** Pipeline (pre-sale) and account (post-sale) lifecycles differ (`LeadStatus` vs `CustomerLifecycleStatus`). Seed data converts `lead-001`…`lead-020` into customers.

**Where:** `types/lead.ts`, `types/customer.ts`, `leadService.convert`, `POST /api/leads/[id]/convert`, `data/leads.ts` / `data/customers.ts`.

---

## ADR-003 — Relationships are IDs only

**Decision:** Foreign keys are string IDs (`assignedTo`, `leadId`, `customerId`, `entityId`, …). No nested user/lead objects on domain records.

**Why:** Matches a relational DB shape and avoids circular payloads. Names are resolved at read boundaries when needed (e.g. `assignedUser` on lead details).

**Where:** Domain types under `types/`; `LeadAssignee` on `LeadDetails`.

---

## ADR-004 — Appointments/tasks point at exactly one of lead or customer

**Decision:** Optional `leadId` / `customerId` on the domain types; service create/update require exactly one. Lead conversion migrates related tasks/appointments to the new customer.

**Why:** Work items exist both before and after conversion. XOR belongs at the service boundary (see ADR-014), not as nested domain graphs.

**Where:** `types/appointment.ts`, `types/task.ts`, `services/validation.ts` (`assertLeadCustomerXor`), `leadService.convert`.

---

## ADR-005 — Deterministic seed data as the data store

**Decision:** In-memory TypeScript arrays in `/data` with helpers (`d`, `pad`) produce stable IDs and timestamps. No runtime randomness.

**Why:** Predictable demos, tests, and agent workflows. `lib/faker.ts` exists but is empty and must not become a runtime faker path.

**Update (ADR-021):** `/data` is no longer the runtime store — services now query PostgreSQL. `/data` is now **only** the seed source, loaded into the DB by the idempotent `npm run db:seed`. Determinism still matters (it defines the seeded rows), but nothing reads `/data` at request time.

**Where:** `data/*`, `AGENTS.md` §6, `scripts/seed.ts`.

---

## ADR-006 — Service layer owns business logic

**Decision:** CRUD, filters, timelines, dashboard aggregation, lead details assembly, and convert live in services.

**Why:** Route handlers stay boring; logic is reusable across endpoints.

**Where:** `services/*.service.ts` (e.g. `dashboardService.getSummary`, `leadService.getDetails` / `convert`, `activityService.getTimeline`).

---

## ADR-007 — Thin REST API

**Decision:** Standard collection + `[id]` routes with `GET`/`POST`/`PATCH`/`DELETE`, plus a few resource-specific actions.

**Why:** Familiar SaaS shape; easy to map to future OpenAPI or a real backend.

**Extras chosen deliberately:**

- `GET /api/dashboard` — aggregated read model for the home screen
- `GET /api/reports` — analytics read model derived from domain services (no report entity)
- `GET /api/leads/[id]/details` — composite detail payload
- `POST /api/leads/[id]/convert` — domain action, not a generic PATCH

---

## ADR-008 — Domain vs DTO date typing

**Decision:** Services return domain types with `Date`. Client hooks/components consume `*Dto` / `WithIsoDates` shapes after JSON serialization.

**Why:** `Response.json` cannot preserve `Date` instances. Explicit DTOs keep TypeScript honest on the client.

**Where:** `types/common.ts` (`WithIsoDates`), per-entity `*Dto`, `DashboardSummary` vs `DashboardSummaryDto`, `LeadDetails` vs `LeadDetailsDto`.

---

## ADR-009 — Lightweight API client + hooks (no React Query)

**Decision:** `lib/api.ts` wraps `fetch` with JSON + `ApiError`. Feature hooks (`useLeads`, `useCustomers`, `useAppointments`, `useDashboard`, `useLeadDetails`, `useCustomerDetails`) expose `data` / `loading` / `error` / `refresh` (and mutations where needed).

**Why:** Enough for seed-scale CRM screens without dependency or caching complexity. Shared `useApiQuery` for simple GETs; custom hook when mutations + refresh are required.

**Where:** `lib/api.ts`, `hooks/*`.

---

## ADR-010 — Component architecture (ui kit + feature modules)

**Decision:** Reusable primitives under `components/ui`; feature UIs under `components/{feature}`; avoid micro-components for rows/cells.

**Why:** Readability and consistency across modules; matches product structure (leads, customers, appointments, dashboard, …).

**Where:** `AGENTS.md` §4; `components/ui`, `components/leads`, `components/customers`, `components/appointments`, `components/dashboard`, `components/layout`.

---

## ADR-011 — Client-side list filtering for leads

**Decision:** `/api/leads` returns the full list; the leads page filters/sorts in the client via `filterLeads`.

**Why:** Simple for current seed volume; keeps the list API thin. Server-side search/filter can move into `leadService.search` + query params when needed.

**Where:** `components/leads/utils.ts`, `app/(dashboard)/leads/page.tsx`.

---

## ADR-013 — Appointments list: full GET + client views and lookups

**Decision:** The appointments page uses `GET /api/appointments` (full collection), parallel `useLeads` / `useCustomers` for related-entity labels, and client-side view modes (upcoming vs by-month) plus status filtering. No query params on the appointments API despite `appointmentService.getUpcoming` / `getInRange` existing.

**Why:** Consistent with ADR-011 for seed-scale data; avoids a new composite list endpoint for v1. Service-level range helpers stay available when server-side filtering is needed.

**Where:** `hooks/useAppointments.ts`, `components/appointments/utils.ts`, `app/(dashboard)/appointments/page.tsx`.

---

## ADR-012 — Dashboard shell via AppShell

**Decision:** Authenticated CRM routes live under `(dashboard)/` and use `AppShell` (sidebar navigation + header). The root `/` route redirects to `/dashboard`. Auth is still deferred.

**Why:** A consistent navigation shell makes multi-module CRM flows usable while keeping auth and polish for a later pass.

**Where:** `app/(dashboard)/layout.tsx`, `components/layout/AppShell.tsx`, `components/layout/navigation.ts`, `app/page.tsx`.

---

## ADR-014 — Service-layer validation

**Decision:** POST/PATCH validation lives in services (required fields, enums, referenced IDs, lead/customer XOR, date coercion). Shared primitives live in `services/validation.ts`. No schema-validation library (Zod/etc.) yet.

**Why:** AGENTS.md puts business rules in services; API stays thin. Shared assert helpers avoid copy-paste across entity services without a new dependency.

**Consequence:** Each service still owns its create/update field set; helpers are primitives, not entity schemas. A library can replace this later if rules grow complex.

**Update (ADR-021):** the referenced-ID checks (`assertUserId` / `assertLeadId` / `assertCustomerId` / `assertServiceId`, `assertEntityReference`, `assertLeadCustomerXor`) now query PostgreSQL via Prisma and are `async`; format/enum/date primitives stay synchronous.

**Superseded in part by ADR-022:** the pure format/enum/date/number/tags primitives have moved to Zod schemas in `lib/schemas/*`. DB-backed checks listed above remain in `services/validation.ts`.

**Where:** `services/validation.ts`, `services/*.service.ts` create/update paths.

---

## ADR-015 — Typed service errors

**Decision:** `services/errors.ts` defines `ServiceError` with codes `VALIDATION` | `NOT_FOUND` | `CONFLICT`. Services throw these for validation failures, missing convert targets, and delete conflicts.

**Why:** Generic `Error` / boolean deletes could not distinguish “bad input” from “blocked by dependents.” Callers need a stable code to map HTTP status.

**Consequence:** Only three codes for now. Do not grow an error-class hierarchy; add a code only when a new HTTP mapping is required.

**Where:** `services/errors.ts`; thrown from validation helpers and lead/customer delete/convert.

---

## ADR-016 — Centralized API error handling & deterministic contract

**Decision:** `lib/api-route.ts` owns all HTTP concerns. Every route wraps its handler in `withApiErrors`, which routes any thrown value through `apiErrorResponse`. The `ErrorCode` taxonomy (`services/errors.ts`) maps to status once: `VALIDATION→400`, `UNAUTHORIZED→401`, `FORBIDDEN→403`, `NOT_FOUND→404`, `CONFLICT→409`, `INTERNAL→500`. Zod errors that reach the boundary → 400 with field details; Prisma `P2002` → 409, `P2025` → 404; anything else is logged server-side and returned as a bare `500 "Internal Server Error"` (no message/stack/SQL/Prisma detail leaks).

Responses are deterministic envelopes: success is `{ success: true, data, pagination? }` (helpers `ok` / `created` / `okPaginated` / `noContent`); error is `{ success: false, error: { message, details? } }`. `details` is `Record<string, string[]>` from Zod field errors.

**404 architecture:** Services stay transport-agnostic and return `null` / `false` for "not found". Routes translate that into a thrown `ServiceError("NOT_FOUND")` via the shared `assertFound` helper, so every 404 flows through the one centralized handler — no route hand-writes a 404.

**Why:** One code→status→body map keeps routes thin, responses uniform, and internal errors un-leaked, while services remain HTTP-free and reusable.

**Consequence:** This is intentionally a small set of helpers, not a generic route-handler framework or middleware stack. `lib/api.ts` unwraps the success envelope centrally so existing consumers keep their shapes; `UNAUTHORIZED` / `FORBIDDEN` are representable now for a future authenticated fork but never thrown yet.

**Where:** `lib/api-route.ts`, `services/errors.ts`; every handler in `app/api/**`.

---

## ADR-017 — Error UI vs empty UI

**Decision:** `ErrorState` is distinct from `EmptyState`. Page-level fetch failures use `ErrorState`; missing/empty collections use `EmptyState`.

**Why:** Reusing empty styling for errors made failed requests look like “no data.”

**Consequence:** Two small presentational components with the same shape as `LoadingState`. No toast/alert system yet.

**Where:** `components/ui/ErrorState.tsx`, `components/ui/EmptyState.tsx`; dashboard list/detail pages.

---

## ADR-018 — Shared related task list

**Decision:** Lead and customer detail pages render related tasks via one `RelatedTasks` component under `components/tasks/`, with `tasks` and optional `emptyMessage`.

**Why:** `LeadTasks` and `CustomerTasks` were near-identical; duplicating feature-specific wrappers violated AGENTS.md’s extraction rules.

**Consequence:** Shared only for this list surface—not a generic “related entity panel” framework.

**Where:** `components/tasks/RelatedTasks.tsx`; `app/(dashboard)/leads/[id]/page.tsx`, `app/(dashboard)/customers/[id]/page.tsx`.

---

## ADR-019 — Pre-database MVP boundaries

**Decision:** Until a real database migration, keep intentionally: in-memory `/data` seed arrays, mutable arrays mutated by services, sequential `nextId()`, polymorphic `entityType` + `entityId` on activities/notes, no repository/DAO layer, and no transaction abstraction.

**Why:** Layered services already isolate UI/API from storage. Adding repositories, UUIDs, or fake transactions before a DB would be premature scaffolding.

**Consequence:** Deletes/convert are multi-step in-memory updates (no atomic rollback). Referential checks and XOR are service-enforced, not DB constraints. Revisit all of the above during database migration.

**Superseded by ADR-021:** the service layer is now PostgreSQL/Prisma-backed. Referential integrity is enforced by `RESTRICT` foreign keys (surfaced as `ServiceError.CONFLICT`), and the polymorphic `entity_type`/`entity_id` model carried over unchanged. `nextId()` is retained (text IDs). Multi-step deletes/convert are still not wrapped in a single transaction — a remaining follow-up.

**Where:** `data/*`, `services/helpers.ts` (`nextId`), `types/activity.ts` / `types/note.ts`, service CUD methods.

---

## ADR-020 — Local PostgreSQL via Docker, isolated on host port 5433

**Decision:** Local dev Postgres runs in Docker: container `pulse-crm-postgres`, image `postgres:17`, database `pulse_crm`, user `pulse`, named volume `pulse-crm-db-data`, published on host port **5433** (container-side port stays 5432). Prisma's `DATABASE_URL` targets `localhost:5433`.

**Why:** The Windows host already runs native PostgreSQL 18 as a service (`postgresql-x64-18`) bound to port 5432. Mapping the container to that same host port produced a Prisma `P1000 Authentication failed` error that looked credentials-related but was actually a TCP port collision — confirmed via `netstat -ano | findstr :5432` (both `postgres.exe` and `com.docker.backend.exe` listening) and `sc query postgresql-x64-18` (service running). We chose to isolate Pulse CRM by changing the container's host port rather than stopping/uninstalling the native install, since other local projects may depend on it.

**Consequence:** Any local connection string must use port 5433, not 5432. This container is now the live datastore for the running app (see ADR-021), not just provisioning.

**Where:** local Docker container `pulse-crm-postgres`; `.env` `DATABASE_URL`.

---

## ADR-021 — Service layer migrated to PostgreSQL via Prisma (milestone: complete)

**Decision:** All domain services now read and write PostgreSQL through the shared Prisma client (`@/lib/prisma`) instead of the in-memory `/data` arrays. This completes the storage swap ADR-001/ADR-019 anticipated, and supersedes the "pre-database MVP boundaries" of ADR-019.

**Runtime flow now:**

```
API routes → services → Prisma Client → PostgreSQL (Docker, ADR-020)
```

**Scope — all 9 domain tables are Prisma-backed:** `users`, `leads`, `customers`, `appointments`, `tasks`, `services`, `invoices`, `activities`, `notes`. Every service (`leadService`, `customerService`, `appointmentService`, `taskService`, `serviceService`, `invoiceService`, `activityService`, `noteService`) plus the `dashboardService` / `reportService` aggregators now compose live DB queries. `/data` is **only** the seed source — there are **zero `/data` imports in the service layer** (only `scripts/seed.ts` reads it).

**`validation.ts` existence checks are now async and DB-backed.** `assertUserId` / `assertLeadId` / `assertCustomerId` / `assertServiceId`, `assertEntityReference`, and the `assertLeadCustomerXor` / `resolveLeadCustomerLink` helpers query Prisma and return Promises; `validateCreateInput` / `validateUpdateInput` (and their call sites) are `async` and `await` them. Pure format checks (`assertRequiredString`, `assertEnum`, date coercion, `assertTags`, `assertPositiveNumber`) stay synchronous.

**Why async validation was required:** the original checks validated referenced IDs against the in-memory `/data` arrays. Once records live in the database, a row created directly in Postgres (e.g. a new `lead-051` with no `/data` entry) would have been wrongly rejected — a hidden `/data` dependency that would break DB-backed records. Reference validation must check the real database, which is inherently async. This was the one cross-cutting change beyond a per-service swap.

**Database shape decisions (schema in `prisma/schema.prisma`, DDL in `db/migrations/`):**

- **Text primary keys** — human-readable sequential IDs (`lead-001`, `cust-020`) preserved from the seed model; `services/helpers.ts` `nextId()` derives the next id from existing rows.
- **`TEXT` enum-like columns** — `status`, `source`, `priority`, `lifecycle_status`, etc. are plain `TEXT`; the allowed values stay enforced in the service layer (ADR-014), not as Postgres `ENUM` types, so adding a value is a code change with no migration.
- **`timestamptz`** for all timestamps (`created_at`, `updated_at`, `starts_at`/`ends_at`, `occurred_at`, `due_date`, …) — timezone-aware instants.
- **`TEXT[]`** for `leads.tags` — native Postgres array, mapped directly to the domain `string[]`.
- **Polymorphic `entity_type` + `entity_id`** on `activities` and `notes` (no FK) — one timeline table serves every entity, as in ADR-019; these two columns are intentionally not foreign-keyed.
- **`RESTRICT` foreign keys** — FKs use `onDelete: Restrict` / `onUpdate: Restrict`, so the DB blocks deleting a row that still has dependents. Services surface this as a controlled `ServiceError.CONFLICT` (ADR-015) via explicit dependency counts before deleting.
- **`BIGINT` money** — `invoices.amount_cents` is `BIGINT`; the mapper converts to a JS `number` (`Number(row.amount_cents)`) on read and `BigInt(...)` on write, keeping the domain `amountCents: number` contract.
- **Application-managed `updated_at`** — services set `updated_at: now()` in every write patch rather than relying on a DB trigger, keeping update semantics visible in the service code.

**Mappers:** each service has a `toX(row)` mapper translating snake_case / nullable DB rows to the camelCase domain type (`null → undefined`), plus a `toUpdatePatch` for partial updates. Column renames (`start`→`starts_at`, `end`→`ends_at`, `timestamp`→`occurred_at`) live in these mappers.

**Seed process:** `npm run db:seed` (`scripts/seed.ts`) loads `/data` into Postgres. It is **idempotent** — every row is `upsert`ed by its existing id in FK-safe order, so re-runs are safe and IDs stay stable. `/data` remains the single source of truth for seed content (ADR-005).

**Verification (at migration time):** project TypeScript check passed; the integration suite (`scripts/integration-test.ts`, run against the seeded DB) reported **53/53 passing** across CRUD and domain operations (lead→customer conversion with task/appointment migration, dependency-delete guards, DB-backed reference validation, appointment range checks, invoice BigInt round-trip, activity/note timelines, dashboard/report aggregation). All test-created rows are cleaned up and the database is restored to baseline seed counts.

**API routes intentionally unchanged.** No `app/api/**` handler was touched — the service layer abstracts storage (ADR-001), so swapping in-memory arrays for Prisma stayed entirely below the API boundary. This is the payoff of the layered architecture.

**Tradeoffs / follow-ups:**

- **Search is still in application memory** for `leadService.search` / `customerService.search` — they fetch then filter in-process to preserve the exact case-insensitive substring semantics (and, for leads, matching across the `tags` array). Move to SQL (`ILIKE` / trigram / FTS) when data volume warrants.
- **Ordering is now explicit** (`ORDER BY id ASC`) where the in-memory version relied on array insertion order. Because IDs are zero-padded and sequential, results are identical.
- **`invoices.invoice_number` uniqueness** is a DB constraint; a duplicate currently surfaces as a raw Prisma error rather than a `ServiceError.CONFLICT`. Map it to a controlled error if/when the create path needs to report duplicates cleanly.

**Where:** `services/*.service.ts`, `services/validation.ts`, `lib/prisma.ts`, `prisma/schema.prisma`, `db/migrations/*`, `scripts/seed.ts`, `scripts/integration-test.ts`.

---

## ADR-022 — Zod for pure input validation + centralized domain enums

**Decision:** Zod is now the single source of truth for **pure input validation** (required/optional strings, enums, date coercion, non-negative numbers, tags, and create/update input shapes). Schemas live in `lib/schemas/*`. **DB-dependent / business validation stays in the service layer.**

**Layering now:**

```
lib/schemas (Zod)  → shape / type / enum / coercion / pure cross-field rules
services           → DB existence checks, cross-entity workflows, stateful rules
PostgreSQL         → FK / UNIQUE / NOT NULL
```

**Centralized enums (`lib/schemas/enums.ts`)** are the runtime source of truth for every domain vocabulary (lead status/source/priority, customer lifecycle, task status/priority, appointment status, service status, invoice status, activity type, entity type, user role). Each is a `z.enum`; the `*_STATUSES`/`*_VALUES` array is `Schema.options` and the TS type is `z.infer`. `types/*` re-export those enum types (so consumers still import from `types/`), and the previously duplicated runtime arrays in `lead.service`, `report.service`, `dashboard.service`, and `components/{leads,customers,tasks,appointments}/utils.ts` were deleted in favor of importing from `enums.ts`. The module imports only `zod`, so it is safe to reuse from client components (future forms).

**Create/update input types are inferred from schemas** (`CreateLeadInput = z.infer<typeof CreateLeadSchema>`, etc.) and re-exported from each service, replacing the old `Omit<Entity,…>` / `Partial<…>` definitions. Update schemas are `base.partial()`; the `tags` default lives only on the create schema so it never leaks into update patches. Domain read-model interfaces (`Lead`, `Customer`, …) are unchanged.

**Errors:** `parseInput(schema, data)` in `services/validation.ts` converts a `ZodError` into `ServiceError(message, "VALIDATION")`, preserving the existing `VALIDATION` / `NOT_FOUND` / `CONFLICT` → HTTP contract. API routes were not touched.

**What intentionally stayed in `services/validation.ts`:** `parseInput`, `assertUserId` / `assertLeadId` / `assertCustomerId` / `assertServiceId` (+ optional variants), `assertEntityReference`, `assertLeadCustomerXor`, and `resolveLeadCustomerLink` — all DB-backed or stateful. The exactly-one-of `leadId`/`customerId` rule is kept here (not in Zod) because it is validated together with DB existence and, on update, against the existing record. The create-time `appointment end >= start` rule moved to Zod; the update-time comparison stays in the service because it can involve the existing record.

**Verification:** `tsc --noEmit` clean; integration suite `53/53`; seeded counts unchanged (users 5, leads 50, customers 20, appointments 30, tasks 40, services 25, invoices 15, activities 100, notes 60).

**Where:** `lib/schemas/*`, `services/validation.ts`, `services/*.service.ts`, `types/*`, `components/{leads,customers,tasks,appointments}/utils.ts`, `package.json` (adds `zod`).

---

## ADR-023 — Authentication foundation: password hashing, signup/login/logout, PostgreSQL-backed sessions (Milestone 3)

**Decision:** A small, hand-rolled auth layer — no Auth.js/Lucia/better-auth. `bcryptjs` (pure JS, no native build step) hashes passwords. Sessions are rows in the existing `sessions` table (added in Milestone 1); the httpOnly cookie carries only the opaque session id (`crypto.randomBytes(32)`, base64url) — never `userId`/`organizationId`/`role`. Signup always creates a brand-new `organizations` row together with its first `users` row (role `admin`); there is no invitation system, so there is no other way for a signup to join an existing org.

**New files:** `lib/password.ts` (hash/verify), `lib/schemas/auth.schema.ts` (`SignupSchema`/`LoginSchema`), `lib/auth-cookie.ts` (get/set/clear the `pulse_session` cookie — httpOnly, `secure` in production, `sameSite: lax`, 7-day expiry), `services/auth.service.ts` (`signup`, `login`, `logout`, `getSessionContext`), `app/api/auth/{signup,login,logout}/route.ts`.

**Error handling:** reuses the existing `ServiceError` taxonomy — added one factory, `unauthorized()`, matching `notFound()`/`conflict()`. Duplicate email → `CONFLICT` (409, pre-checked, not left to a raw Prisma `P2002`). Wrong password / unknown email / deactivated user → a single generic `UNAUTHORIZED` (401) — never reveals which case occurred. No new error codes; `UNAUTHORIZED` was already in the taxonomy (`services/errors.ts`) reserved for exactly this.

**Session resolution lives in the service layer, not a new `lib/session.ts`:** `authService.getSessionContext(token)` — the DB-backed "is this session valid" check (missing/expired/inactive-user → `UNAUTHORIZED`) — is implemented in `services/auth.service.ts`, because "does this session exist and is it still valid" is a database question, consistent with every other DB-backed check in this codebase living in `services/`. The HTTP-layer wrapper that reads the cookie off an incoming `Request` and wires this into every other route (`requireSession`, `middleware.ts`) is deliberately deferred to a later milestone — this milestone's routes are exactly `signup`/`login`/`logout`, none of which need to *authenticate* an incoming request, only issue or revoke one.

**Deviation from plan.md:** plan.md's Milestone 3 description says this milestone is "what finally lets `password_hash` go `NOT NULL`," with a recommendation to backfill the 5 pre-existing seeded users with a known deterministic password. That backfill/migration was **not done** — plan.md itself flagged both as open questions (§19 #1, #2) needing explicit developer sign-off before Milestone 3, which was never obtained. `password_hash` (and `organization_id`) stay nullable at the schema level; the 5 org-001 and 2 org-002 seed users remain login-disabled (no `password_hash`) until that decision is made and a follow-up migration lands. New users created via `/api/auth/signup` always get a `password_hash`. This keeps the milestone's file footprint exactly what plan.md's own file list says ("new files only, no existing service/route touched") — no `schema.prisma`, `data/*`, or `scripts/seed.ts` changes were needed.

**Tests:** new `scripts/auth-integration-test.ts` (26 checks, same `check()`/`expectServiceError()` harness as `scripts/integration-test.ts`, run against the live seeded DB, self-cleaning) — signup/duplicate-email/login/wrong-password/unknown-email/deactivated-user/session-lookup/session-expiration/logout/invalid-session, plus explicit assertions that no response ever carries `passwordHash`/`password_hash` and that the stored hash is a real bcrypt hash, not plaintext. `scripts/integration-test.ts` (53/53) re-verified unchanged. `npm run test:integration` / `npm run test:auth` added as package.json scripts alongside the existing `db:seed`.

**Verification:** `tsc --noEmit` clean; `next build` clean (three new routes registered as dynamic); manual HTTP smoke test via `curl` against a running `next dev` — signup sets the httpOnly cookie and returns 201 with no `password_hash`, duplicate signup → 409, wrong password → 401, login rotates the session cookie, logout → 204 and clears the cookie (`Max-Age`/`Expires` in the past).

**Where:** `lib/password.ts`, `lib/auth-cookie.ts`, `lib/schemas/auth.schema.ts`, `services/auth.service.ts`, `services/errors.ts` (+`unauthorized()`), `services/index.ts`, `app/api/auth/*`, `scripts/auth-integration-test.ts`, `package.json` (adds `bcryptjs`).

---

## ADR-024 — Session resolution + route gating: `requireSession`, `proxy.ts`, one protected route (Milestone 4)

**Decision:** `lib/session.ts` exports `requireSession(request)` — reads the opaque `pulse_session` cookie straight off `request.headers` (manual `Cookie` header parsing, no dependency added) and calls `authService.getSessionContext` (built in Milestone 3) to resolve `{ userId, organizationId, role }` or throw `ServiceError("UNAUTHORIZED")`. `GET /api/dashboard` is wired to call it first — the one route this milestone touches, exactly as plan.md's Milestone 4 scopes it, proving the full vertical slice (cookie → route → `requireSession` → `authService` → Prisma → 401 or data) before Milestone 6 repeats the pattern everywhere.

**File is `proxy.ts`, not `middleware.ts`:** Next.js 16.0.0 deprecated and renamed the root middleware file convention to `proxy.ts` (exporting `proxy`, not `middleware`) — confirmed in `node_modules/next/dist/docs/.../file-conventions/proxy.md`, per `AGENTS.md`'s own instruction to check that directory before writing Next.js-specific code. `plan.md` was written calling it `middleware.ts` throughout (a pre-existing planning artifact, not re-verified against the installed Next.js version); this repo now uses `proxy.ts`. Behavior matches the plan exactly otherwise: existence-only cookie check (`request.cookies.has(...)`, no DB query), redirects `(dashboard)`-group page visits to `/login` when the cookie is absent, and its `config.matcher` excludes `/api/**` entirely so API callers always get a JSON 401 from their own route's `requireSession` call rather than an HTML redirect. `/`, `/login`, `/signup` are allow-listed explicitly inside the function (simpler and more auditable than fighting a negative-lookahead regex around the root path's empty remainder).

**`/api/dashboard` authenticates but does not yet org-scope its data.** `dashboardService.getSummary()` fans out to `leadService.getAll()`, `customerService.getAll()`/`getActive()`, `appointmentService.getAll()`/`getUpcoming()`, `taskService.getAll()`/`getOpen()`/`getOverdue()`, `invoiceService.getAll()`/`getUnpaid()`/`getOverdue()`, `activityService.getRecent(20)` — none of those 6 services accept `organizationId` yet (that's Milestone 5 for leads, Milestone 6 for the rest). Milestone 4's own file list restricts this milestone to `app/api/dashboard/route.ts` (and optionally `services/dashboard.service.ts`, left untouched here). Accepting an `organizationId` from `requireSession` and then not threading it anywhere would be exactly the "half-finished implementation" `AGENTS.md` §1 warns against, so the route authenticates (401 on missing/invalid/expired session) and calls the existing unscoped `getSummary()` as-is. Full org-scoped dashboard data is Milestone 6's job, once its 6 dependency services are scoped.

**`app/(auth)/login/page.tsx` is a placeholder**, not the real login form — plan.md's Milestone 4 text explicitly anticipates this ("this milestone should either stub a minimal `/login` placeholder or be sequenced immediately before Milestone 7"). It exists only so the proxy redirect has somewhere to land; Milestone 7 replaces it with a real React Hook Form + Zod form.

**Tests:** new `scripts/session-http-test.ts` — 15 `fetch`-based checks against a running server (`/`, `/login` ungated; `/dashboard` redirects to `/login` without a cookie; `/api/dashboard` 401s on missing/garbage/expired session; a real signup's cookie authenticates both the page and the API route; logout invalidates the cookie for subsequent requests). Requires `next dev`/`next start` already running (`BASE_URL` env var overrides the default `http://localhost:3000`) — this is the "HTTP-level checks" pass plan.md §15 describes as a lightweight `fetch` script, not Playwright/Supertest. `scripts/integration-test.ts` (53/53) and `scripts/auth-integration-test.ts` (26/26) re-verified unchanged.

**Verification:** `tsc --noEmit` clean; `next build` clean (`ƒ Proxy (Middleware)` listed, `/login` registered as a static route); manual `curl` and the automated `session-http-test.ts` pass against a live `next dev` server — 401/307/200 behavior confirmed in every case listed above.

**Where:** `lib/session.ts`, `proxy.ts`, `app/(auth)/login/page.tsx`, `app/api/dashboard/route.ts`, `scripts/session-http-test.ts`, `package.json` (+`test:session-http`).

---

## ADR-025 — Lead tenant isolation: the Milestone 5 reference implementation

**Decision:** `leadService` and its 4 routes (`leads/route.ts`, `leads/[id]/route.ts`, `leads/[id]/details/route.ts`, `leads/[id]/convert/route.ts`) are now fully org-scoped, per plan.md §9's canonical pattern — every route calls `requireSession(request)` first and threads `organizationId` into every `leadService` call; every read/write in `lead.service.ts` filters or stamps `organization_id`. This is the template Milestone 6 mechanically repeats for the other 10 services.

**`nextId()` scans globally, not per-org — a correction to plan.md §9's pseudocode.** `id` is a global Prisma `@id` primary key on every table, not scoped to `organization_id`; two orgs generating the same sequential id (e.g. both computing `lead-001` from an org-filtered scan) would collide on the primary key and fail with `P2002`. `lead.service.ts`'s `create()` therefore keeps scanning *all* leads (unfiltered) to compute the next id — unchanged from before this milestone, and consistent with the precedent already set in Milestone 3 (`nextId("org", …)` / `nextId("user", …)` both scan globally) and Milestone 2's seed data (org-002's users are `user-101`/`user-102`, continuing org-001's sequence rather than restarting at `user-001`).

**`assertOrgUserId` is a new, parallel helper — `assertUserId` itself was not touched.** `assertUserId(value, field)` is called by 5 other services (`customer`, `appointment`, `task`, `activity`, `note`) that don't accept `organizationId` yet; changing its signature to require one would have broken all five, forcing this milestone to touch services explicitly out of scope. `services/validation.ts` now has both: the existing unscoped `assertUserId` (unchanged, still used by those 5 services) and a new `assertOrgUserId(organizationId, value, field?)` (used only by `lead.service.ts`). Milestone 6 should migrate every remaining call site to the org-scoped check and then delete the unscoped one (possibly renaming `assertOrgUserId` back to `assertUserId` at that point).

**`leadService.getAll(organizationId?: ID)` keeps its parameter optional — its only unscoped callers (`dashboardService.getSummary()`, `reportService.getSummary()`) are explicitly Milestone 6 work.** Every other caller (the `/api/leads` route, `search()`) always passes it; the two aggregators are the sole, fully-enumerated exception, called out in a code comment on the method itself so a future unscoped caller doesn't slip in silently.

**`getDetails()`'s four cross-service reads and `convert()`'s five cross-service writes were deliberately left unscoped**, matching plan.md §9's own call-out that `convert()`'s downstream organization_id-stamping is Milestone 6 work (`taskService.migrateLeadToCustomer`'s `organization_id` addition is explicitly listed as Milestone 6 scope). Reasoned safety for the reads: `activityService.getTimeline("lead", id)`, `noteService.getForEntity("lead", id)`, `taskService.getByLeadId(id)`, `appointmentService.getByLeadId(id)` are only ever called with an `id` that `getDetails`' own `getById(organizationId, id)` guard has already proven belongs to the caller's org — and since every table's `id` is a global primary key (previous paragraph), there is no other org's row these calls could return data for. The writes in `convert()` are a real, temporary, intentional gap: a lead converted between this milestone and Milestone 6 produces a customer/migrated tasks/migrated appointments/activity row with `organization_id` left unset (`NULL`), exactly as it does today before this milestone — not a regression, and explicitly the shape of gap plan.md §9 accepts during the phased rollout. What *does* change here: `convert()` now requires proof the source lead belongs to the caller's org before doing anything (a cross-org convert attempt 404s at the very first line, before any write) — that entry-point check is this milestone's actual contribution to `convert()`'s security.

**Tests:** `scripts/integration-test.ts` gained a new `[11] Lead tenant isolation` section (12 checks: cross-org `getById`/`update`/`delete`/`convert` all fail closed — `null`/`false`/`NOT_FOUND`, never partial data; cross-org `assignedTo` → `VALIDATION`; `getByStatus`/`search` never cross org lines) — 65/65 total, up from 53. New `scripts/lead-http-test.ts` (14 HTTP-level checks against a running server, mirroring "two browser sessions" from plan.md §15/Milestone 5): two freshly-signed-up orgs each create a lead, `GET /api/leads` is isolated both ways, cross-org `GET`/`PATCH`/`DELETE`/`convert` by id all 404 (never 403 — doesn't confirm existence), a client-supplied `organizationId` in a `POST` body is silently stripped by Zod and the created row gets the caller's real org (proving the §2/§6 "never trust client-supplied organizationId" guarantee end-to-end), and no session at all → 401.

**Verification:** `tsc --noEmit` and `next build` both clean; `scripts/integration-test.ts` 65/65, `scripts/auth-integration-test.ts` 26/26, `scripts/session-http-test.ts` 15/15, `scripts/lead-http-test.ts` 14/14 — 120 checks total, all green. Manual browser walkthrough was not available in this environment; `lead-http-test.ts` is the HTTP-level substitute plan.md's own Milestone 5 text anticipates ("manual browser check … two browser sessions/incognito") and additionally confirmed a signed-up user can load `/leads` and `/leads/new` with a real session cookie.

**Where:** `services/lead.service.ts`, `services/validation.ts` (+`assertOrgUserId`), `app/api/leads/**` (all 4 routes), `scripts/integration-test.ts`, `scripts/lead-http-test.ts`, `package.json` (+`test:lead-http`). No other service, route, or CRM page was touched.

---

## ADR-026 — Full tenant scoping: remaining 9 services, 18 routes, and closing the Milestone 5 gaps (Milestone 6)

**Decision:** Every remaining service (`customer`, `appointment`, `task`, `activity`, `note`, `service`, `invoice`, `user`, plus the `dashboard`/`report` aggregators) now follows the exact canonical pattern ADR-025 established for leads — `organizationId` mandatory as the first parameter on every method, every read filters `organization_id`, every create stamps it from the session, every update/delete/cross-reference is org-scoped. All 18 remaining routes call `requireSession` first. `services/validation.ts` was fully consolidated: the parallel `assertOrgUserId` from Milestone 5 is gone — `assertUserId` (and every other `assert*` helper: `assertLeadId`, `assertCustomerId`, `assertServiceId` + optional variants, `assertLeadCustomerXor`, `resolveLeadCustomerLink`) now takes `organizationId` as its first parameter, matching plan.md §10 exactly, with zero parallel/duplicate helpers left.

**`assertEntityReference` is now a real existence + org check for all 7 entity types, not just `lead`/`customer`.** The pre-existing gap (`appointment`/`task`/`service`/`invoice`/`note` unconditionally passing — plan.md §2/§10) is closed with a genuine `findFirst({ id, organization_id })` per type. One deliberate deviation from plan.md §10's own pseudocode: `note` is checked for real existence too, rather than hardcoded to always fail — `EntityTypeSchema` already allows `"note"` as a valid target, so treating it identically to every other type is more consistent and no less safe (the plan's own footnote called it "unreachable via current call sites," so this has no behavioral effect on existing code paths, only removes a special case).

**The Milestone 5 gaps in `leadService.convert()`/`getDetails()` are closed now that their dependencies are scoped.** `convert()` threads `organizationId` into all 7 downstream calls (`customerService.getByLeadId`/`create`, `taskService.migrateLeadToCustomer`, `appointmentService.migrateLeadToCustomer`, `activityService.create`) — a converted customer, its migrated tasks/appointments, and the conversion activity now all carry the correct `organization_id` instead of `NULL`. `getDetails()` threads it into its 4 downstream reads. The two `migrateLeadToCustomer` methods add `organization_id` to their `updateMany` `where` clause (defense in depth — the `lead_id` alone was already enough given globally-unique ids, but this matches every other cross-table write in the codebase). Verified directly: a fresh HTTP-level lead→customer conversion now produces a customer row whose `organization_id` matches the caller's org (`tenant-isolation-http-test.ts`).

**`userService.getAll`/`getById` are org-scoped** — closes the gap plan.md §9 calls "high-risk": every `assignedTo`/`performedBy`/`createdBy` picker across every entity depends on this, or every org would have silently seen every other org's employees as assignable users.

**`dashboardService.getSummary`/`reportService.getSummary` thread `organizationId` into all 12 and 5 of their fan-out calls respectively** — the single highest-leverage aggregate fix, per plan.md §9, and only possible now that all 6 (dashboard) / 4 (report) dependency services are themselves scoped.

**Invoice number uniqueness confirmed working as designed:** `@@unique([organization_id, invoice_number])` (Milestone 1) accepts the same number reused across two different orgs and still rejects a true duplicate within one org — verified with a fresh cross-org reuse in `integration-test.ts`. That same-org rejection surfaces as a raw `Prisma.PrismaClientKnownRequestError` (`P2002`) at the service layer, not a `ServiceError` — P2002→409 translation only happens at the API boundary (`lib/api-route.ts`'s `apiErrorResponse`, unchanged), exactly like every other unique constraint in this codebase; the test asserts the Prisma error directly rather than assuming a `ServiceError` that the architecture was never going to produce at that layer.

**No transaction wrapping was added to `convert()` or any other multi-step operation** — stays the separate, already-tracked ADR-019/021 item, per plan.md §2/§9/Milestone 6's own explicit "Do NOT."

**Tests:** `scripts/integration-test.ts` grew a `[12] Cross-service tenant isolation` section (20 checks: cross-org `getById` → `null` for every one of the 8 remaining entities + users; cross-org foreign-reference validation for customer/service/invoice/task/appointment creation; the closed `assertEntityReference` gap verified for `appointment`/`task`/`service`/`invoice` entity types, plus a same-org positive case proving it's a real check, not just a blanket rejection) and `[10]`/`[4]` gained explicit per-org aggregate/conversion-stamping assertions — **91/91 total**, up from 65. New `scripts/tenant-isolation-http-test.ts` (22 HTTP-level checks): two fresh orgs each convert a lead to a customer over real HTTP, the converted row's `organization_id` is verified directly against the database, `/api/customers` and `/api/users` are isolated both ways, a cross-org customer fetch 404s, `/api/dashboard` and `/api/reports` return distinct per-org totals (not a global aggregate), and every route 401s with no session.

**Verification:** `tsc --noEmit` and `next build` both clean across the entire codebase (every call site of every changed method was caught by the compiler — nothing was missed, matching plan.md Milestone 9's own audit goal ahead of schedule). Full suite: `integration-test.ts` 91/91, `auth-integration-test.ts` 26/26, `session-http-test.ts` 15/15, `lead-http-test.ts` 14/14, `tenant-isolation-http-test.ts` 22/22 — **168 checks total, all green**. All test data created during HTTP-level runs was cleaned from the live Neon database afterward.

**Where:** `services/{customer,appointment,task,activity,note,service,invoice,user,dashboard,report,lead}.service.ts`, `services/validation.ts`, `app/api/{customers,appointments,tasks,activities,notes,services,invoices,users,dashboard,reports}/**` (18 routes), `scripts/integration-test.ts`, `scripts/tenant-isolation-http-test.ts`, `package.json` (+`test:tenant-http`). No CRM page was touched — every dashboard page continues to talk only to `/api/**`, so tenant scoping required zero frontend changes, exactly as plan.md §12 predicted.

---

## ADR-027 — Frontend auth integration: login/signup pages, current-user display, working logout (Milestone 7)

**Decision:** Real login/signup forms now exist at `app/(auth)/login/page.tsx` and `app/(auth)/signup/page.tsx` (React Hook Form + `zodResolver`, driven directly by the existing `LoginSchema`/`SignupSchema` from `lib/schemas/auth.schema.ts` — no new validation rules invented), matching the exact form-primitive pattern every CRUD form in the app already uses (`FormField`/`FormInput`/`Button` from `components/ui`, `api.post`/`toErrorMessage`/`applyServerFieldErrors` from `lib/api`/`lib/form-errors`). `components/layout/AppShell.tsx`'s previously-dead `href="#"` logout link is now a real control (both in the sidebar and a new header avatar dropdown) that `POST`s `/api/auth/logout` and hard-redirects to `/login`; the static avatar icon now shows the current user's initials and, on click, their name/email plus the logout action.

**A new route, `GET /api/auth/me`, had to be built — plan.md §7/§11 specified it but no milestone had created it yet.** It's a two-line `requireSession` + `userService.getById` route, identical in shape to every other thin route in the codebase, backing a new `hooks/useCurrentUser.ts` (same `useApiQuery` pattern as `useUsers.ts`). Milestone 3's own `authService`-level `toUser()` already populated `organizationId` on its response, but `services/user.service.ts`'s separate `toUser()` mapper (used by `getAll`/`getById`, i.e. the one `/api/auth/me` calls) did not — a pre-existing gap that plan.md §7's own contract for `/me` (`{ id, name, email, role, organizationId }`) made a real requirement here rather than a hypothetical one. Fixed with the same one-line `organization_id ?? undefined` mapping `auth.service.ts` already used, closing the inconsistency between the two `toUser()` functions rather than leaving a second copy to drift.

**No provider/context wrapper was added to `app/layout.tsx`.** Every dashboard page already fetches exclusively through `/api/**` per plan.md §12's prediction, and `useCurrentUser()` is a plain per-component hook call (only `AppShell` needs it) — a global auth/session React context would be state nothing else reads, which `AGENTS.md` §1/§8 rule out as unearned abstraction.

**`app/(dashboard)/layout.tsx` was left unchanged**, confirming plan.md §12's recommendation: Milestone 4's `proxy.ts` is the sole route-gating layer; a second belt-and-suspenders check in the layout would duplicate that responsibility.

**Verification:** manual end-to-end smoke test against the running dev server (not just unit-level) — unauthenticated `GET /dashboard` → `307` to `/login`; `POST /api/auth/signup` → `201` with a session cookie set; `GET /api/auth/me` with that cookie → `200` with the full `{ id, name, email, role, organizationId, ... }` shape; `GET /dashboard` with the cookie → `200`; `POST /api/auth/logout` → `204`; `GET /api/auth/me` afterward → `401`. `tsc --noEmit` and `eslint` both clean on every new/changed file (pre-existing lint findings in unrelated files — `LeadForm.tsx`, `LeadSummary.tsx`, `ServiceForm.tsx`, `AppointmentsPanel.tsx`, `TaskForm.tsx`, and one pre-existing effect in `AppShell.tsx` itself predating this milestone — were left untouched, out of scope for a frontend-auth-integration pass). Full `scripts/integration-test.ts` still 91/91 (no service/route logic changed beyond the new `/me` route and the `user.service.ts` mapper fix).

**Where:** new `app/(auth)/login/page.tsx` (rewritten from the Milestone 4 placeholder), new `app/(auth)/signup/page.tsx`, new `components/auth/{LoginForm,SignupForm,index}.tsx`, new `app/api/auth/me/route.ts`, new `hooks/useCurrentUser.ts` (+ `hooks/index.ts` export), modified `components/layout/AppShell.tsx` (logout wiring + `UserMenu`), modified `services/user.service.ts` (`toUser` now maps `organizationId`). No existing dashboard/CRM page was rewritten; `app/page.tsx`'s CTAs were left pointing at `/dashboard` (cosmetic-only per plan.md §12, not required for correctness).

---

## Open decisions (not finalized in code)

- Public users API vs always resolving names in composite service responses.
- Whether to push `leadService.search` / `customerService.search` into SQL (still in-process; unrelated to tenancy).
- Whether/how to backfill `password_hash` for the 5 pre-existing org-001 and 2 org-002 seed users and flip `password_hash` to `NOT NULL` (plan.md §19 #2, ADR-023) — currently those users cannot log in.
- `middleware.ts`/`proxy.ts`'s route-gating check remains cookie-existence-only (no DB query) — this is by design (plan.md §8), not a gap; `requireSession` is the real enforcement point on every API route.
- No RBAC yet — `users.role` is stored and returned but never gates a route or service call (plan.md §4.8, deliberately deferred).
