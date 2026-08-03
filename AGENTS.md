# Pulse CRM — Agent & Engineering Standards

This document is the source of truth for how we build Pulse CRM.
Follow it for every change — humans and AI assistants alike.

---

## Next.js version note

This project uses a Next.js version that may differ from your training data.
APIs, conventions, and file structure can change between releases.

Before writing Next.js-specific code, read the relevant guide in
`node_modules/next/dist/docs/`. Heed deprecation notices.

---

## 1. Project Philosophy

- **Simplicity over cleverness.** Prefer the obvious solution.
- **Readability over abstraction.** A clear 80-line file beats five clever 10-line files.
- **Feature-first development.** Ship one complete feature at a time (data → API → UI).
- **Functionality before visual polish.** Working flows beat gradients, animations, and theming.

Build like a real SaaS product: consistent, predictable, and easy to extend.
Do not over-engineer for scale we do not have yet.

---

## 2. Architecture

Layered flow (never skip layers):

```
Domain (types) → Seed Data → Services → API → UI
```

| Layer | May import | Must not import |
| --- | --- | --- |
| `types` | other types only | everything else |
| `data` | `types`, `data/helpers` | `services`, `app`, `components` |
| `services` | `data`, `types` | `app`, `components` |
| `app/api` | `services`, `types` | `data` |
| UI (`app/(dashboard)`, `components`) | `types`, `components`, `lib`, `utils` | `services`, `data` |

Rules:

- **Services are the only layer allowed to access `/data`.**
- **API never imports from `/data`.** Route handlers call services only.
- **UI never imports services or data.** The UI talks to the app through HTTP (`/api/...`).

This keeps the UI honest and makes a future database swap a service-layer change.

---

## 3. Project Structure

| Path | Purpose |
| --- | --- |
| `app/` | Next.js App Router: pages, layouts, and route handlers |
| `app/(dashboard)/` | Authenticated CRM screens |
| `app/api/` | Thin REST handlers; no business logic |
| `components/ui/` | Generic, reusable UI primitives (Button, DataTable, SearchInput, …) |
| `components/{feature}/` | Feature-specific UI (`leads`, `customers`, `tasks`, …) |
| `components/layout/` | Shell chrome (sidebar, header, nav) |
| `components/shared/` | Cross-feature CRM pieces that are not generic primitives |
| `services/` | Business logic and data access |
| `data/` | Deterministic seed/mock data (stand-in for a DB) |
| `types/` | Domain models and shared TypeScript types |
| `lib/` | App-level helpers (formatting, constants, config) |
| `utils/` | Small pure helpers with no domain ownership |
| `hooks/` | Shared React hooks |

Keep nesting shallow. Prefer `components/leads/LeadTable.tsx` over
`components/leads/table/rows/LeadRow.tsx`.

---

## 4. Components

### Extract a component when it:

- Is reused in multiple places, or
- Encapsulates business logic, or
- Encapsulates complex UI behavior, or
- Represents an entire feature surface (`LeadTable`, `LeadFilters`, `LeadForm`)

### Do not extract:

- Table rows / cells (`LeadRow`, `TableCell`)
- Headers, labels, or other trivial JSX wrappers
- One-off markup with no logic

Keep rows and cells **inside** the parent table unless they have independent logic
or true reuse.

### Placement

- Generic primitives → `components/ui`
- Feature UI → `components/{feature}`
- Pages (`page.tsx`) only: fetch data, hold page state, compose feature components

Favor **fewer, larger, readable components** over many tiny files.
Clarity beats maximum componentization.

---

## 5. TypeScript

- Use strong, explicit types. Avoid `any`.
- Model entities like a database would: flat records, not deep nested graphs.
- **Relationships are IDs only** (`assignedTo: ID`, `customerId: ID`). Resolve names in the UI or via dedicated API joins later.
- Put shared primitives in `types/common.ts` (`ID`, `BaseEntity`, …).
- One domain file per entity (`types/lead.ts`, `types/customer.ts`, …).
- Prefer `import type` for type-only imports.
- **No circular dependencies** between `types`, `data`, and `services`.

API JSON serializes `Date` as strings. Feature DTOs may reflect that
(e.g. `createdAt: string`) when consuming `/api` from the client.

---

## 6. Seed Data

Seed data lives in `/data` and must be:

- **Deterministic** — same IDs and values every run
- **Realistic** — plausible CRM content (names, phones, companies)
- **Relationally valid** — every foreign ID must exist
- **Not random** — no `Math.random()`, no faker-at-runtime

Use helpers like `d()` / `pad()` for stable timestamps and IDs.
Document intentional quirks in comments when they encode business rules
(e.g. “lead-001…lead-020 are converted”).

---

## 7. API

- Route handlers are **thin**: parse input → call service → return JSON + status.
- **Business logic belongs in services**, not in routes or components.
- Use proper HTTP status codes:
  - `200` / `201` success
  - `400` validation / bad body
  - `404` missing resource
  - `500` unexpected failure (sparingly; prefer controlled errors)
- Follow REST conventions:
  - `GET /api/leads`, `POST /api/leads`
  - `GET /api/leads/[id]`, `PATCH` / `PUT`, `DELETE`
- Do not import seed arrays in route files.

---

## 8. Code Style

- Keep functions small and single-purpose.
- Name things by what they do (`filterLeads`, `leadService.getByStatus`).
- Prefer explicit code over clever indirection.
- Avoid unnecessary abstractions, wrappers, and “utils for one call site.”
- Comment **business decisions**, not obvious syntax.
- Match existing file patterns before inventing new ones.
- Do not add `useMemo` / `useCallback` by default; follow React Compiler guidance unless the codebase already relies on them for a hot path.

---

## 9. UI Principles

- Build the feature completely (loading, empty, error, happy path) before polishing.
- Reuse `components/ui` primitives; do not restyle the same control three ways.
- Keep design minimal while features are landing — no gradients, animation passes, or theme systems unless requested.
- Accessibility where practical: labels on inputs, semantic tables, keyboard-usable controls.
- Responsive by default: tables scroll horizontally; toolbars wrap on small screens.
- Client components only when you need state, effects, or browser APIs.

---

## 10. What to Avoid

- Premature optimization
- Over-componentization (row/cell/header micro-files)
- Deep folder nesting
- Magic constants (use named unions / shared constants)
- Duplicated filter/sort/format logic across features — share via `lib` / `utils` / `ui`
- Large `page.tsx` files full of business logic
- UI importing `services` or `data`
- API importing `data`
- Random or non-deterministic seed data
- Polishing UI before the feature works end-to-end

---

## Quick checklist for new work

1. Types updated?
2. Seed data valid and deterministic?
3. Service owns the logic?
4. API is thin and status-correct?
5. UI fetches via `/api` only?
6. Feature components meaningful; ui primitives reused?
7. Page only composes — no buried business rules?

If a change fights these rules, change the approach — not the rules —
unless this document is explicitly updated.
