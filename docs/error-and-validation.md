# Pulse CRM — Error & Validation Architecture

A practical reference for how a request is validated, how errors travel, and how
the frontend consumes them. Read this before adding a new module or forking the
project — the pattern is centralized and meant to be **reused, not re-invented**.

This is the "how it works" companion to the decisions in
[`decisions.md`](decisions.md): ADR-014 (service validation), ADR-015 (typed
errors), ADR-016 (API boundary + contract), ADR-022 (Zod schemas + parse).

---

## The pipeline

```
schemas → parse → validation → service → errors → API boundary → API client → form errors
```

Each stage has exactly one job and one home. HTTP knowledge lives only at the
boundary; the service layer never speaks HTTP.

---

## 1. `lib/schemas/` — shape validation (Zod)

Defines the **shape** of request input with Zod: required/optional strings,
enums, date coercion, non-negative numbers, tags, and the create/update object
shapes. One file per entity (`lead.schema.ts`, `customer.schema.ts`, …), with
shared field builders in `fields.ts` and every domain vocabulary in `enums.ts`.

- **Create/update input types are inferred from the schemas**
  (`CreateLeadInput = z.infer<typeof CreateLeadSchema>`) and re-exported from the
  service. Update schemas are `base.partial()`.
- **`enums.ts` is the runtime source of truth** for status/source/priority/etc.;
  `types/*` re-export those enum types, so consumers still import from `types/`.
- The module imports only `zod`, so schemas are safe to reuse **client-side** for
  UX validation (React Hook Form). The **same schema on the server is
  authoritative** — the client copy is a convenience, never the gate.

Schemas do **not** touch the database. Anything requiring DB truth lives in §3.

---

## 2. `services/parse.ts` — untrusted input → typed input or a validation error

Pure, no database access. Bridges Zod to the service error vocabulary.

- `parseInput(schema, data)` runs `schema.safeParse`; on failure it throws
  `ServiceError(message, "VALIDATION", details)`. The first issue becomes the
  human-readable `message`; every field issue is preserved in `details`.
- `zodFieldErrors(error)` flattens a `ZodError` into
  `{ field: [messages] }` (path-less issues grouped under `_form`). Shared with
  the API boundary so a stray Zod error produces the same field shape.

Services call `parseInput` first; everything downstream works with typed input.

---

## 3. `services/validation.ts` — database truth & business rules

The home for validation that **must query PostgreSQL** (via the shared Prisma
client). These functions are `async`; callers `await` them.

- Existence checks: `assertUserId`, `assertLeadId`, `assertCustomerId`,
  `assertServiceId` (+ `assertOptional*` variants), `assertEntityReference`.
- Relationship rules: `assertLeadCustomerXor` (exactly one of `leadId` /
  `customerId`, then existence of the supplied id) and `resolveLeadCustomerLink`
  (applies the XOR rule against the existing record on update).

Why here and not in Zod: a schema can't know whether `assignedTo` points at a
real user, or whether a lead/customer id exists. That needs the database.

---

## 4. `services/*.service.ts` — business operations

Domain logic: CRUD, filters, timelines, aggregation, conversion. A create/update
typically reads: `parseInput(...)` → `await assert...` → Prisma write → map row
to the domain type.

- **Transport-agnostic.** Services must **NOT** import `NextResponse` /
  `Response`, set status codes, or build HTTP bodies.
- For "not found", services return `null` / `false` (or throw a typed
  `ServiceError` for conflicts) — they never return a 404.

---

## 5. `services/errors.ts` — the service error vocabulary

`ServiceError` carries a `code: ErrorCode` and optional field `details`. The
codes are an **internal taxonomy**, deliberately separate from HTTP:

```
VALIDATION | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | INTERNAL
```

A code like `NOT_FOUND` is a *category of failure*, not the number `404`. The
mapping to an HTTP status happens once, at the boundary (§6) — so the service
layer stays reusable outside HTTP.

Factory helpers read as intent while keeping the type uniform:
`notFound(msg)`, `conflict(msg)`, `validation(msg)`. `UNAUTHORIZED` /
`FORBIDDEN` exist for a future authenticated fork but are never thrown yet.

---

## 6. `lib/api-route.ts` — the API boundary (HTTP translation)

The single place HTTP lives. Every route wraps its handler in `withApiErrors`,
which sends any thrown value through `apiErrorResponse`:

- `ServiceError` → its mapped status (`VALIDATION→400`, `UNAUTHORIZED→401`,
  `FORBIDDEN→403`, `NOT_FOUND→404`, `CONFLICT→409`, `INTERNAL→500`), with
  `details`.
- A stray `ZodError` → `400` with field details.
- Prisma `P2002` (unique) → `409`; `P2025` (record required) → `404`.
- **Anything else** → logged server-side and returned as a bare
  `500 "Internal Server Error"`. No message/stack/SQL/Prisma detail ever leaks.

**Deterministic response contract:**

```
success → { success: true, data, pagination? }
error   → { success: false, error: { message, details? } }
```

Success helpers: `ok` / `created` / `okPaginated` / `noContent`.
Input helpers: `readJson` (malformed JSON → 400, not 500) and `assertFound`
(turns a service's `null`/`false` into a `NOT_FOUND` so every 404 flows through
this one handler — routes never hand-write a 404).

HTTP knowledge belongs **here**, nowhere else.

---

## 7. `lib/api.ts` — the frontend API client

Wraps `fetch` and consumes the deterministic envelope so callers get clean data:

- `unwrapSuccess` returns `data` (or `{ data, pagination }` for paginated
  responses) from `{ success: true, ... }`.
- On a non-OK response it parses `{ success: false, error }` and throws an
  `ApiError` carrying `status`, `message`, and `details`.
- `toErrorMessage(error, fallback)` — safe message for banners.
- `getErrorDetails(error)` — the field-level `details`, if any.

All UI data access goes through `api.get/post/patch/delete` (via hooks); UI never
imports services or Prisma.

---

## 8. `lib/form-errors.ts` — server errors → React Hook Form

`applyServerFieldErrors(error, setError)` reads an `ApiError`'s `details` and
calls RHF's `setError` per field. It skips the `_form` group and is a no-op when
there are no structured details — so field errors land on the right inputs while
detail-less errors (404/409/500) fall back to the form's banner.

Typical form `catch`:

```ts
catch (error) {
  applyServerFieldErrors(error, setError);              // field-level
  setSubmitError(toErrorMessage(error, "Could not save…")); // banner fallback
}
```

---

## 9. End-to-end example: "Create Lead" with a bad `assignedTo`

```
LeadForm (client)                       user submits; RHF may pre-validate with the Zod schema
  → api.post("/api/leads", body)        lib/api.ts
  → POST /api/leads                      app/api/leads/route.ts (wrapped in withApiErrors)
  → leadService.create(body)             services/lead.service.ts
      → parseInput(CreateLeadSchema)     services/parse.ts  (shape OK → typed input)
      → await assertUserId(assignedTo)   services/validation.ts  → user missing:
                                         throw ServiceError("Unknown user: …", "VALIDATION")
  → error bubbles out of the service (no HTTP knowledge)
  → withApiErrors → apiErrorResponse     lib/api-route.ts
      → maps VALIDATION → 400
      → { success: false, error: { message, details? } }
  → lib/api.ts sees !ok → throws ApiError(400, message, details)
  → LeadForm catch:
      applyServerFieldErrors → field error on assignedTo (if details present)
      toErrorMessage → banner
```

A **missing customer** (e.g. an appointment/task pointing at a non-existent
`customerId`) follows the identical path — it just fails at
`assertCustomerId` / `assertLeadCustomerXor` in §3 instead of `assertUserId`.
Either way it surfaces as a controlled `400`, never a raw 500.

---

## 10. When adding a new module (e.g. `Campaigns`)

**Add these per-module files:**

| File | Purpose |
| --- | --- |
| `lib/schemas/campaign.schema.ts` | Create/Update Zod schemas + inferred input types (add any new enum to `lib/schemas/enums.ts`) |
| `services/campaign.service.ts` | `parseInput` → `await assert…` → Prisma → map; register in `services/index.ts` |
| `app/api/campaigns/route.ts` (+ `[id]/route.ts`) | Thin handlers wrapped in `withApiErrors`, returning the success helpers |
| `components/campaigns/…` + a hook | UI + `api.*` calls; forms use `applyServerFieldErrors` / `toErrorMessage` |

**Reuse — do NOT duplicate — the centralized infrastructure:**

- `services/errors.ts` — same `ServiceError` / `ErrorCode` vocabulary.
- `services/parse.ts` — same `parseInput`.
- `services/validation.ts` — reuse existing DB-backed asserts; add a new one only
  if you introduce a genuinely new reference.
- `lib/api-route.ts` — same boundary, contract, and helpers. Do **not** write a
  per-module error handler or response shape.
- `lib/api.ts` + `lib/form-errors.ts` — same client + form-error mapping.

If a new failure needs a new HTTP status, add a **code** to `ErrorCode` (and its
status mapping) — do not invent a parallel error type or envelope.

---

## Architecture rules to remember

- Schemas validate **shape**.
- Parse converts **untrusted input** into typed input or a validation error.
- Validation checks **database truth** and business rules.
- Services perform **business operations**.
- Services **do not speak HTTP** (no `NextResponse`/`Response`/status codes).
- `ServiceError` is the **service-layer error vocabulary** (codes, not statuses).
- `lib/api-route.ts` is the **one HTTP translation boundary**.
- API responses follow **one deterministic contract**.
- The frontend consumes errors through the **shared API client**.
- **Do not** create per-module error handlers or response formats.
