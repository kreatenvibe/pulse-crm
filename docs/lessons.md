# Pulse CRM — Lessons Learned

Practical principles from building this repo so far. Prefer these over re-learning the same mistakes.

---

## Clarity over component count

- Do not extract table rows, cells, or one-off wrappers into their own files.
- Extract when something is reused, owns real logic, or is a full feature surface (`LeadTable`, `LeadFilters`, `LeadActions`).
- An early leads UI split (`LeadRow`, `LeadSearch` as tiny files) was rolled back in favor of fewer, larger components plus shared `components/ui` primitives.
- Local helpers inside a file (e.g. a small field renderer) are fine; separate files for trivial JSX are not.

---

## Feature folders vs UI kit

- Put generic controls in `components/ui` (`SearchInput`, `SelectFilter`, `DataTable`, `EmptyState`, `LoadingState`, `Button`).
- Put CRM-specific composition in `components/{feature}`.
- Pages should compose feature components, not rebuild filter bars and tables from scratch.

---

## Respect the layer cake

```
types → data → services → API → hooks/UI
```

- Only **services** may import `/data`.
- **API routes** stay thin: parse → service → JSON + status.
- **UI and hooks** must not import services or seed data; they use HTTP via `lib/api`.
- This keeps a future DB swap inside the service layer.

---

## Domain models vs wire models

- Domain entities use `Date`. JSON over HTTP turns those into ISO strings.
- Client code should type API responses as DTOs (`LeadDto`, `WithIsoDates`, `DashboardSummaryDto`, `LeadDetailsDto`).
- Mixing domain `Date` types with client fetch results causes TypeScript lies and subtle bugs.
- Prefer one shared formatter module (`lib/format.ts`) over copying `formatLabel` / `formatDate` into every feature folder (duplication still exists in `components/leads/utils.ts` — avoid spreading it further).

---

## Fetching without a data library

- A small `api.get/post/patch/delete` + `ApiError` is enough at this stage.
- Shared `useApiQuery` covers simple list/summary reads (`useLeads`, `useCustomers`, `useAppointments`, `useDashboard`).
- Screens with mutations need an explicit refresh path (`useLeadDetails`: action → API → `refresh()`).
- Pass **stable** `initialData` references into `useApiQuery` (module-level constants). Inline `[]` / `{}` in the hook call recreates identity every render and can refetch in a loop.
- Do not introduce React Query, SWR, or global stores until caching/invalidation pain is real.

---

## Pages stay thin

- Pages: call hooks, hold UI-only state (filters, form drafts), compose components.
- Do not bury fetch loops or business rules in `page.tsx`.
- Client-side list filtering is OK for seed-sized datasets; keep the filter function next to the feature, not in the route handler, unless the API needs it.

---

## Composite reads for detail screens

- Lead detail needs lead + activities + notes + tasks + appointments.
- A dedicated `GET /api/leads/[id]/details` (backed by `leadService.getDetails`) beats N parallel client fetches for the first version of the page.
- Resolve display joins the UI cannot see (e.g. assignee name from users) in the service response when there is no users API yet.

---

## Related labels on list screens

- Detail screens justify a composite API when many joined slices load at once (see above).
- List screens can instead fetch the base collection plus other **existing** list endpoints and build ID lookup maps on the client (`buildAppointmentLookups` + `enrichAppointment` on the appointments page).
- Fine at seed scale; add a dedicated list/read API or query params when round-trips or payload size hurt.
- Without a users API, assignee columns on list pages may show raw IDs even when detail `getDetails` resolves names in the service.

---

## Calendar-style views without a library

- Grouping records by date into day sections (`AppointmentSchedule`) is enough for a first calendar UX.
- Defer a calendar library until drag-reschedule, week/month grid, or heavy interaction is actually required.

---

## Seed data discipline

- Seeds must be deterministic, realistic, and relationally valid — no runtime `Math.random()` / faker.
- Encode business rules in comments and generators (e.g. `lead-001`…`lead-020` convert to customers).
- Empty placeholder files (`lib/faker.ts`, unused `data/dashboard.ts`) invite the wrong patterns; leave them empty only briefly or delete them.
- Prefer aggregating dashboard metrics in a service over a parallel fake “dashboard seed” file.

---

## Lead vs customer modeling

- Keep **Lead** and **Customer** as separate entities.
- Conversion is explicit (`convert`): create customer with `leadId`, set lead status to `converted`.
- One customer per lead is the documented invariant (`Customer.leadId`).
- Appointments/tasks may attach to lead **or** customer (`leadId?` / `customerId?`); XOR is still a TODO — do not pretend it is enforced yet.

---

## Local Postgres / Docker debugging

- Host port conflicts masquerade as auth errors: a Prisma `P1000 Authentication failed` turned out to be a TCP port collision, not a bad user/password. Windows' native PostgreSQL 18 service (`postgresql-x64-18`) was already bound to 5432 when the Docker container tried to publish on the same host port.
- Check for competing listeners *before* trusting credentials: `netstat -ano | findstr :<port>` to see which PIDs are bound, `sc query <service>` to confirm a suspect Windows service is running.
- Don't stop or uninstall an existing native service to make room for a project's container — other local projects may depend on it. Isolate instead by remapping the container's **host** port (e.g. `5433:5432`); the container-side port can stay 5432. Update `DATABASE_URL` to match the new host port.
- A Docker named volume (e.g. `pulse-crm-db-data`) persists independently of the container. Stopping/removing/recreating the container is safe as long as it's reattached to the same volume — verified here by recreating `pulse-crm-postgres` and confirming a previously seeded row was still present.
- Unrelated stopped containers (e.g. an old `pgvector` image) are not project dependencies just because they exist on the same machine — don't assume they're involved when debugging a Pulse CRM connection issue.

---

## Prisma 7 requires a driver adapter

- Pulse CRM runs Prisma 7.x with PostgreSQL. In Prisma 7 a driver adapter is mandatory: `new PrismaClient()` with no config raises a TypeScript error (the constructor now requires options).
- Fix for Postgres: install the matching `@prisma/adapter-pg` package. `lib/prisma.ts` builds a `PrismaPg` adapter from `process.env.DATABASE_URL` and passes it to `PrismaClient`.
- Keep the Next.js dev singleton (cache the client on `globalThis` outside production) so hot reload doesn't spawn multiple clients / connection pools.
- `DATABASE_URL` stays in `.env` — never commit it or document it with the real password.
- Remember this when starting future Prisma projects: the adapter requirement is a Prisma 7-specific setup step that earlier versions didn't need.

---

## Standalone tsx scripts don't inherit `.env`

- `prisma.config.ts` loading dotenv only covers Prisma CLI runs — a standalone script executed with `tsx` (e.g. `scripts/test-prisma.ts`) does **not** get `.env` variables from it.
- Symptom: the script failed with `client password must be a string` because `DATABASE_URL` was `undefined` at runtime, not because of bad credentials.
- Fix: add `import "dotenv/config";` as the first import in the standalone script so it loads `.env` itself.
- Milestone: with that in place, Prisma Client queried the real Docker PostgreSQL database and returned the existing `lead-001` record — first live DB read confirmed.

---

## Migrating in-memory services to a real database

Lessons from swapping the `/data` arrays for PostgreSQL/Prisma (ADR-021):

- **Validation must check the database, not stale in-memory arrays.** Reference checks (`assertUserId`, `assertLeadId`, …) that validated against `/data` were a hidden `/data` dependency: a row created directly in the DB would be wrongly rejected because it wasn't in the seed array. Moving these to Prisma made them `async` and rippled `validateCreateInput`/`validateUpdateInput` (and their callers) to `async` — plan for that fan-out. Keep pure format/enum/date checks synchronous.
- **Do the shared foundation first.** `validation.ts` is imported by every service; migrating it (and re-typechecking) before touching the individual services meant each service migration was then independent and safe to parallelize.
- **Map DB shapes at the edges.** A `toX(row)` mapper per service (snake_case→camelCase, `null`→`undefined`) plus a `toUpdatePatch` keeps the domain type clean. Column renames (`start`→`starts_at`, `timestamp`→`occurred_at`) live only in the mapper.
- **`BIGINT` money needs explicit conversion.** `amount_cents` is `BIGINT`; convert with `Number(row.amount_cents)` on read and `BigInt(...)` on write to keep the domain `amountCents: number` contract. Skipping this leaks `bigint` into JSON/UI.
- **Ordering was implicit; make it explicit.** In-memory `filter` preserved array insertion order. Add `ORDER BY id ASC` to match it — safe here because IDs are zero-padded and sequential.
- **In-memory substring search can stay in-process at first.** Fetch-then-filter preserves exact case-insensitive semantics (and array-field matching like `tags`) without wrestling Prisma filters; move to SQL (`ILIKE`/FTS) only when volume demands.
- **Seed idempotently.** `npm run db:seed` upserts every row by id in FK-safe order, so re-runs are safe and IDs stay stable; `/data` stays the single source of seed truth.
- **The layered architecture paid off.** Because API routes call services (not storage), the entire DB swap stayed below the API boundary — **zero API route changes**. Verify the swap with an integration suite that exercises CRUD + domain flows against the seeded DB and cleans up after itself.

---

## Ship function before polish

- Loading, empty, and error states matter more than visual systems.
- Minimal borders/spacing is enough while modules land.
- Auth, theming, and animation can wait until core flows work.

---

## AI / IDE development

- Treat `AGENTS.md` as the contract: if generated code fights the rules, change the code.
- Read local Next.js docs under `node_modules/next/dist/docs/` before assuming App Router APIs.
- Prefer inspecting the repo over inventing architecture in docs or PRs.
- Scaffold folders with `.gitkeep` only while empty; remove `.gitkeep` once real files exist.
- Ask for feature-complete vertical slices (types → UI) instead of isolated “pretty” components with no data path.
