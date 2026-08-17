# Pulse CRM

A CRM built with Next.js (App Router) and PostgreSQL/Prisma for managing the
full customer lifecycle: leads, customers, appointments, tasks, services,
invoices, and reporting.

## Features

- **Leads** — capture, track status/priority/source, and convert to customers
- **Customers** — lifecycle tracking with linked appointments, tasks, services, and invoices
- **Appointments** — scheduling tied to leads or customers
- **Tasks** — assignable follow-ups per lead/customer
- **Services** — service records per customer
- **Invoices** — billing tied to customers
- **Activities & Notes** — audit trail and free-form notes across entities
- **Dashboard & Reports** — aggregate views across the CRM
- **Users** — assignable owners for leads, customers, appointments, and tasks

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [React 19](https://react.dev)
- [Prisma 7](https://www.prisma.io) with the `@prisma/adapter-pg` driver adapter
- PostgreSQL
- [Tailwind CSS 4](https://tailwindcss.com)
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) for form validation
- TypeScript

## Architecture

The codebase follows a strict layered flow — each layer only talks to the one below it:

```
types → data → services → app/api → UI (app/(dashboard), components)
```

- **`types/`** — domain models shared across the app
- **`services/`** — all business logic and database access (via Prisma)
- **`app/api/`** — thin REST route handlers that call services only
- **`app/(dashboard)/`** — authenticated CRM screens; fetch data via `/api`, never via services directly
- **`components/ui/`** — generic, reusable UI primitives
- **`components/{feature}/`** — feature-specific UI (leads, customers, tasks, …)
- **`prisma/schema.prisma`** — database schema (users, leads, customers, appointments, tasks, services, invoices, activities, notes)

See [AGENTS.md](./AGENTS.md) for the full engineering standards this project follows.

## Getting Started

### Prerequisites

- Node.js
- A PostgreSQL database (local dev is expected on `localhost:5433`, e.g. via Docker)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment contract and fill in your database connection string:

   ```bash
   cp .env.example .env
   ```

3. Apply the schema and seed the database:

   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Lint the codebase |
| `npm run db:seed` | Seed the database (`scripts/seed.ts`) |

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
