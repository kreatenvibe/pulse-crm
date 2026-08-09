# Pulse CRM — Project Status

Last reviewed: **9 Aug 2026** — against types, services, API, hooks, and UI.

---

## Current phase

**Foundation + early product UI — now on a real database.**

Domain models, deterministic seed data, service layer, and REST APIs are in place for the core CRM entities. **The service layer has been migrated to PostgreSQL via Prisma** (ADR-021): all 9 domain services now read/write the database, `/data` is only the seed source, and API routes were left unchanged. Frontend work covers **Dashboard**, **Leads** (list + detail), **Customers** (list + detail), **Appointments**, **Tasks**, and **Reports**. App shell navigation (`AppShell`) is wired through `(dashboard)/layout.tsx`. **Settings** remains a placeholder page only.

---

## Completed architecture layers

| Layer | Status | Notes |
| --- | --- | --- |
| `types/` | Complete for current domains | Entities + wire DTOs (`WithIsoDates`, feature DTOs) |
| `data/` | Complete seed sets | Deterministic; now the DB seed source only (loaded by `npm run db:seed`) |
| `services/` | Complete CRUD + domain queries | PostgreSQL/Prisma-backed (ADR-021); imports `@/lib/prisma`, zero `/data` imports |
| `app/api/` | Complete thin REST for entities | Plus dashboard, lead/customer details, convert; unchanged by the DB migration |
| `lib/api.ts` + hooks | Complete for used screens | Lightweight `fetch` wrapper; no React Query/SWR |
| UI modules | Partial | Dashboard, Leads, Customers, Appointments, Tasks, Reports |
| Auth | Not built | — |
| Layout chrome | Complete | `AppShell` — fixed-height sidebar, scrollable nav, mobile drawer |
| Real database | **Complete** | All 9 services on PostgreSQL via Prisma (ADR-021); Docker Postgres 17 on host port 5433 (ADR-020) |

---

## Completed features / modules

### Done

- **Leads list** — `/leads`: search, status/source filters, sort by created date, loading/empty/error, table via `useLeads`
- **Lead details** — `/leads/[id]`: profile, timeline (activities + notes), tasks, appointments, actions (status, note, schedule, convert) via `useLeadDetails`
- **Customers list** — `/customers`: search, lifecycle filter, sort by created date, loading/empty/error, table via `useCustomers`
- **Customer details** — `/customers/[id]`: profile, timeline, services, invoices, appointments via `useCustomerDetails` + `GET /api/customers/[id]/details`
- **Appointments list** — `/appointments`: date-grouped schedule (`AppointmentSchedule`), view modes (upcoming / by month with prev-next), status filter, links to related lead or customer, loading/empty/error via `useAppointments` + `useLeads` / `useCustomers` for name lookups. No `/appointments/[id]` detail page yet.
- **Tasks list** — `/tasks`: summary counts (open, overdue, due today, completed), view modes, status/priority filters, table with related lead/customer links via `useTasks` + `useLeads` / `useCustomers` for lookups. No `/tasks/[id]` detail page yet.
- **Dashboard** — `/dashboard`: summary stats, pipeline by status, upcoming appointments slice, recent activity via `useDashboard`
- **Reports** — `/reports`: lead pipeline/source/conversion, appointment status breakdown, task open vs completed, invoice/revenue summary via `useReports` + `GET /api/reports` (`reportService` composes existing domain services; no report seed data)
- **Lead → Customer conversion** — `POST /api/leads/[id]/convert` + `leadService.convert`
- **App shell** — responsive sidebar + mobile drawer in `components/layout`; fixed viewport-height sidebar with scrollable main nav; Settings pinned at bottom; active route highlighting

### Placeholder only (stub `page.tsx`, no feature UI)

- Pages: `/settings`
- Component folders: `components/shared`

### Empty stub files (0 bytes; unused)

- `lib/constants.ts`, `lib/faker.ts`, `lib/formatters.ts`, `lib/validators.ts`
- `utils/currency.ts`, `utils/dates.ts`, `utils/helpers.ts`, `utils/phone.ts`
- `data/dashboard.ts` (dashboard data comes from `dashboardService`, not this file)

---

## Hooks (client data layer)

| Hook | Endpoint(s) | Used by |
| --- | --- | --- |
| `useLeads` | `GET /api/leads` | Leads list |
| `useLeadDetails` | `GET/PATCH/POST` on leads + details + convert + appointments | Lead detail |
| `useCustomers` | `GET /api/customers` | Customers list, Appointments (lookups) |
| `useCustomerDetails` | `GET /api/customers/[id]/details` | Customer detail |
| `useAppointments` | `GET /api/appointments` | Appointments list |
| `useTasks` | `GET /api/tasks` | Tasks list |
| `useDashboard` | `GET /api/dashboard` | Dashboard |
| `useReports` | `GET /api/reports` | Reports |

Shared read helper: `useApiQuery` in `hooks/useApiQuery.ts`.

---

## Current API capabilities

All handlers import **services only** (not `/data`).

| Resource | Collection | By id | Extra |
| --- | --- | --- | --- |
| Leads | `GET`, `POST` | `GET`, `PATCH`, `DELETE` | `GET .../details`, `POST .../convert` |
| Customers | `GET`, `POST` | `GET`, `PATCH`, `DELETE` | `GET .../details` |
| Appointments | `GET`, `POST` | `GET`, `PATCH`, `DELETE` | — (no query params; service has `getUpcoming` / `getInRange` unused by API) |
| Tasks | `GET`, `POST` | `GET`, `PATCH`, `DELETE` | — |
| Activities | `GET`, `POST` | `GET`, `PATCH`, `DELETE` | — |
| Notes | `GET`, `POST` | `GET`, `PATCH`, `DELETE` | — |
| Services | `GET`, `POST` | `GET`, `PATCH`, `DELETE` | — |
| Invoices | `GET`, `POST` | `GET`, `PATCH`, `DELETE` | — |
| Dashboard | `GET /api/dashboard` | — | Aggregated summary + lists |
| Reports | `GET /api/reports` | — | Analytics derived from domain services |

No `/api/users` route. Assignee **names** resolve in service `getDetails` responses (leads/customers). List pages (leads table, appointments list) show assignee **IDs** until a users API exists.

---

## Current frontend architecture

```
Page (client) → hooks → lib/api (fetch) → /api/* → services → Prisma Client → PostgreSQL
```

- **Pages** hold UI-only state and compose feature components.
- **`components/ui`**: `Button`, `DataTable`, `EmptyState`, `LoadingState`, `SearchInput`, `SelectFilter`.
- **`components/leads`**: list + detail (`LeadTable`, `LeadFilters`, profile/timeline/tasks/appointments/actions).
- **`components/customers`**: list + detail (`CustomerTable`, `CustomerFilters`, profile/timeline/services/invoices/appointments).
- **`components/appointments`**: list-only (`AppointmentFilters`, `AppointmentSchedule`, `utils.ts` for filter/group/enrich).
- **`components/tasks`**: list-only (`TaskFilters`, `TaskSummary`, `TaskTable`, `utils.ts` for filter/count/enrich).
- **`components/reports`**: read-only analytics (`BreakdownSection`, `ConversionReport`, `TaskCompletionReport`, `RevenueReport`; reuses dashboard `PipelineOverview`).
- **`components/dashboard`**: `StatCard`, `DashboardSummary`, `PipelineOverview`, `UpcomingAppointments`, `RecentActivity`.
- **`components/layout`**: `AppShell`, `navigation` config.
- **`lib/format.ts`**: shared `formatLabel`, `formatDate`, `formatDateTime`, `formatTime`, `formatTimeRange`.
- Client filter/sort/view logic lives in feature `utils.ts` (not on the server) for seed-scale lists.

Root `/` is still the default create-next-app page.

---

## What is currently working

- **Leads** — full vertical slice: seed → service → API → hook → list/detail UI, including mutate-and-refresh on detail.
- **Customers** — list via `useCustomers`; detail via composite details API (profile joins, services, invoices, appointments, timeline).
- **Appointments** — list vertical slice: `GET /api/appointments` → `useAppointments`; client view modes and status filter; related lead/customer labels from parallel list hooks; date-grouped schedule UI. Create/update still available via API (used from lead detail schedule action); no dedicated appointments form on the list page.
- **Tasks** — list vertical slice: `GET /api/tasks` → `useTasks`; summary counts and view modes (open / overdue / due today / completed); status and priority filters; related lead/customer labels from parallel list hooks. Create/update still available via API (used from lead detail); no dedicated task form on the list page.
- **Dashboard** — aggregated read model: counts, pipeline, upcoming appointments slice, recent activities.
- **Reports** — aggregated analytics read model: `reportService.getSummary()` composes lead, appointment, task, and invoice services; no report entity or seed file.
- **Backend** — CRUD and query helpers for activities, notes, catalog services, invoices (API-testable), all backed by PostgreSQL/Prisma.
- **Layering** — `AGENTS.md` rules followed: UI/hooks do not import `services` or `data`; services now talk to Prisma, and the DB swap stayed below the API boundary (ADR-021).

---

## PostgreSQL database (now the live datastore)

The app runs on a Docker Postgres 17 container; all services query it via Prisma:

- Container `pulse-crm-postgres` (image `postgres:17`), database `pulse_crm`, user `pulse`, named volume `pulse-crm-db-data`.
- Published on host port **5433** (container port stays 5432) because the Windows host already runs native PostgreSQL 18 as service `postgresql-x64-18` on port 5432. See ADR-020 for why port 5433 was chosen.
- `.env` `DATABASE_URL` points Prisma at `localhost:5433`. Prisma 7 requires a driver adapter — `lib/prisma.ts` wires `@prisma/adapter-pg`.
- Schema: `prisma/schema.prisma` (DDL in `db/migrations/`). Seed: `npm run db:seed` (`scripts/seed.ts`) loads `/data` idempotently in FK-safe order.

**Milestone — service-layer DB migration complete (ADR-021):** all 9 domain services (`users`-referencing leads, customers, appointments, tasks, services, invoices, activities, notes) now read/write PostgreSQL; `validation.ts` existence checks are async and DB-backed; `/data` is only the seed source (zero `/data` imports in `services/`). API routes were intentionally left unchanged — the service layer abstracts storage. TypeScript check passes and the integration suite (`scripts/integration-test.ts`) reports **53/53 passing**, with all test rows cleaned up and the DB restored to baseline seed counts.

---

## Known gaps / limitations

- No auth, no users API.
- `leadService.search` / `customerService.search` filter in application memory; `invoices.invoice_number` duplicates surface as raw Prisma errors (see ADR-021 tradeoffs). Multi-step delete/convert are not yet wrapped in a DB transaction.
- Appointments: no detail route; assignee column shows user ID; no calendar library (day-grouped list only).
- Tasks: no detail route; assignee column shows user ID.
- Orphan `.gitkeep` files remain in some folders that already have real components/pages.
- `components/leads/utils.ts` still duplicates `formatLabel` / `formatDate` from `lib/format.ts`.

---

## Immediate next steps

Suggested order:

1. **Clean empty stubs** or implement deliberately (`lib/*`, `utils/*`, `data/dashboard.ts`); remove stale `.gitkeep` files.
2. **Home redirect** — point `/` at `/dashboard` (or a real landing).
3. **Settings UI** — placeholder page only.
4. Later: users API or composite list endpoints if client-side joins become painful; auth. **Real DB behind services is done (ADR-021)** — remaining DB follow-ups: SQL-side search, transactional delete/convert, and mapping `invoice_number` duplicates to `ServiceError.CONFLICT`.

---

## Status legend

| Label | Meaning |
| --- | --- |
| **Completed** | Implemented and wired end-to-end (or backend-complete as noted) |
| **In progress** | Partial UI; hooks/API ahead of screens |
| **Planned** | Placeholder pages / stubs / not started (settings UI, auth, full calendar widget) |
