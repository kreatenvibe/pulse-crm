/**
 * Database seed — loads the deterministic `/data` seed arrays into PostgreSQL
 * through the shared Prisma client.
 *
 * - `/data` is the single source of truth; nothing here invents new records.
 * - Every row is written with `upsert` keyed on its existing `id`, so IDs are
 *   preserved and the script is safe to run repeatedly (idempotent).
 * - Nothing is ever deleted; a re-run only inserts missing rows and refreshes
 *   the columns of existing ones.
 * - Tables are seeded in foreign-key order so every referenced row exists first.
 *
 * The `/data` arrays use the domain's camelCase field names; the database
 * columns are snake_case (and rename a few SQL reserved words: appointment
 * start/end -> starts_at/ends_at, activity timestamp -> occurred_at). Each
 * mapper below translates one to the other.
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import {
  organizations,
  users,
  leads,
  customers,
  appointments,
  tasks,
  services,
  invoices,
  activities,
  notes,
} from "@/data";

/**
 * Upsert a batch of already-mapped rows keyed on `id`. Using the same payload
 * for create and update keeps the row identical to `/data` on every run.
 */
async function upsertAll<T extends { id: string }>(
  label: string,
  rows: T[],
  upsertOne: (row: T) => Promise<unknown>,
): Promise<void> {
  for (const row of rows) {
    await upsertOne(row);
  }
  console.log(`  ${label.padEnd(12)} ${rows.length} upserted`);
}

async function main(): Promise<void> {
  console.log("Seeding Pulse CRM database from /data …");

  // 0. Organizations — referenced by every tenant-owned table's organization_id FK.
  await upsertAll("organizations", organizations, (o) => {
    const data = {
      id: o.id,
      name: o.name,
      created_at: o.createdAt,
      updated_at: o.updatedAt,
    };
    return prisma.organizations.upsert({ where: { id: o.id }, create: data, update: data });
  });

  // 1. Users — referenced by every other table's assignee/author FKs.
  await upsertAll("users", users, (u) => {
    const data = {
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar ?? null,
      role: u.role,
      is_active: u.isActive,
      organization_id: u.organizationId ?? null,
      created_at: u.createdAt,
      updated_at: u.updatedAt,
    };
    return prisma.users.upsert({ where: { id: u.id }, create: data, update: data });
  });

  // 2. Leads — FK: assigned_to -> users.
  await upsertAll("leads", leads, (l) => {
    const data = {
      id: l.id,
      name: l.name,
      email: l.email ?? null,
      phone: l.phone,
      status: l.status,
      source: l.source,
      priority: l.priority,
      company: l.company ?? null,
      message: l.message ?? null,
      tags: l.tags,
      assigned_to: l.assignedTo,
      organization_id: l.organizationId ?? null,
      last_contacted_at: l.lastContactedAt ?? null,
      created_at: l.createdAt,
      updated_at: l.updatedAt,
    };
    return prisma.leads.upsert({ where: { id: l.id }, create: data, update: data });
  });

  // 3. Customers — FK: lead_id -> leads, assigned_to -> users.
  await upsertAll("customers", customers, (c) => {
    const data = {
      id: c.id,
      lead_id: c.leadId,
      business_name: c.businessName ?? null,
      primary_contact: c.primaryContact,
      phone: c.phone,
      email: c.email ?? null,
      address: c.address ?? null,
      assigned_to: c.assignedTo,
      organization_id: c.organizationId ?? null,
      lifecycle_status: c.lifecycleStatus,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    };
    return prisma.customers.upsert({ where: { id: c.id }, create: data, update: data });
  });

  // 4. Appointments — FK: lead_id -> leads, customer_id -> customers, assigned_to -> users.
  await upsertAll("appointments", appointments, (a) => {
    const data = {
      id: a.id,
      lead_id: a.leadId ?? null,
      customer_id: a.customerId ?? null,
      title: a.title,
      starts_at: a.start,
      ends_at: a.end,
      status: a.status,
      assigned_to: a.assignedTo,
      organization_id: a.organizationId ?? null,
      notes: a.notes ?? null,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
    };
    return prisma.appointments.upsert({ where: { id: a.id }, create: data, update: data });
  });

  // 5. Tasks — FK: assigned_to -> users, lead_id -> leads, customer_id -> customers.
  await upsertAll("tasks", tasks, (t) => {
    const data = {
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      assigned_to: t.assignedTo,
      lead_id: t.leadId ?? null,
      customer_id: t.customerId ?? null,
      due_date: t.dueDate,
      priority: t.priority,
      status: t.status,
      organization_id: t.organizationId ?? null,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
    };
    return prisma.tasks.upsert({ where: { id: t.id }, create: data, update: data });
  });

  // 6. Services — FK: customer_id -> customers.
  await upsertAll("services", services, (s) => {
    const data = {
      id: s.id,
      customer_id: s.customerId,
      title: s.title,
      description: s.description ?? null,
      status: s.status,
      organization_id: s.organizationId ?? null,
      scheduled_date: s.scheduledDate ?? null,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    };
    return prisma.services.upsert({ where: { id: s.id }, create: data, update: data });
  });

  // 7. Invoices — FK: customer_id -> customers, service_id -> services.
  // amountCents is a JS number in /data; the column is BIGINT -> convert to BigInt.
  await upsertAll("invoices", invoices, (inv) => {
    const data = {
      id: inv.id,
      customer_id: inv.customerId,
      service_id: inv.serviceId ?? null,
      amount_cents: BigInt(inv.amountCents),
      currency: inv.currency,
      invoice_number: inv.invoiceNumber,
      status: inv.status,
      organization_id: inv.organizationId ?? null,
      issued_at: inv.issuedAt,
      due_date: inv.dueDate,
      created_at: inv.createdAt,
      updated_at: inv.updatedAt,
    };
    return prisma.invoices.upsert({ where: { id: inv.id }, create: data, update: data });
  });

  // 8. Activities — polymorphic entity_id (no FK); FK: performed_by -> users.
  await upsertAll("activities", activities, (act) => {
    const data = {
      id: act.id,
      entity_type: act.entityType,
      entity_id: act.entityId,
      type: act.type,
      description: act.description,
      performed_by: act.performedBy,
      organization_id: act.organizationId ?? null,
      occurred_at: act.timestamp,
      created_at: act.createdAt,
      updated_at: act.updatedAt,
    };
    return prisma.activities.upsert({ where: { id: act.id }, create: data, update: data });
  });

  // 9. Notes — polymorphic entity_id (no FK); FK: created_by -> users.
  await upsertAll("notes", notes, (n) => {
    const data = {
      id: n.id,
      entity_type: n.entityType,
      entity_id: n.entityId,
      content: n.content,
      created_by: n.createdBy,
      organization_id: n.organizationId ?? null,
      created_at: n.createdAt,
      updated_at: n.updatedAt,
    };
    return prisma.notes.upsert({ where: { id: n.id }, create: data, update: data });
  });

  // Verify: report the row count of every table after seeding.
  const counts = {
    organizations: await prisma.organizations.count(),
    users: await prisma.users.count(),
    leads: await prisma.leads.count(),
    customers: await prisma.customers.count(),
    appointments: await prisma.appointments.count(),
    tasks: await prisma.tasks.count(),
    services: await prisma.services.count(),
    invoices: await prisma.invoices.count(),
    activities: await prisma.activities.count(),
    notes: await prisma.notes.count(),
  };

  console.log("\nRow counts after seed:");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(12)} ${count}`);
  }
  console.log("\nSeed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
