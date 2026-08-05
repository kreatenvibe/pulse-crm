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

**Where:** `data/*`, `AGENTS.md` §6.

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

**Where:** `services/validation.ts`, `services/*.service.ts` create/update paths.

---

## ADR-015 — Typed service errors

**Decision:** `services/errors.ts` defines `ServiceError` with codes `VALIDATION` | `NOT_FOUND` | `CONFLICT`. Services throw these for validation failures, missing convert targets, and delete conflicts.

**Why:** Generic `Error` / boolean deletes could not distinguish “bad input” from “blocked by dependents.” Callers need a stable code to map HTTP status.

**Consequence:** Only three codes for now. Do not grow an error-class hierarchy; add a code only when a new HTTP mapping is required.

**Where:** `services/errors.ts`; thrown from validation helpers and lead/customer delete/convert.

---

## ADR-016 — Centralized API error mapping

**Decision:** `lib/api-route.ts` exports `serviceErrorResponse`, which maps `ServiceError` → HTTP (`400` / `404` / `409`) with `{ error: message }`. Mutating routes catch and return that helper.

**Why:** Keeps every route handler thin and status-consistent without duplicating the code→status switch.

**Consequence:** This is intentionally one function, not a generic route-handler framework or middleware stack.

**Where:** `lib/api-route.ts`; `app/api/**` POST/PATCH/DELETE (and convert) catch blocks.

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

**Where:** `data/*`, `services/helpers.ts` (`nextId`), `types/activity.ts` / `types/note.ts`, service CUD methods.

---

## Open decisions (not finalized in code)

- Public users API vs always resolving names in composite service responses.
- Replace seed arrays with a real database (Postgres/etc.) behind the same services (see ADR-019).
- Auth model for “authenticated CRM screens” described in `AGENTS.md`.
