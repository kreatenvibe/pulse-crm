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

## Open decisions (not finalized in code)

- Public users API vs always resolving names in composite service responses.
- Whether to push `leadService.search` / `customerService.search` into SQL, and to map `invoice_number` duplicates to `ServiceError.CONFLICT` (see ADR-021 tradeoffs).
- Auth model for “authenticated CRM screens” described in `AGENTS.md`.
