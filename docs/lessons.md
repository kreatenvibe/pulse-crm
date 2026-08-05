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
