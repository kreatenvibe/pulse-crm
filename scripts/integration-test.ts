/**
 * Integration tests for the Prisma-backed service layer, run against the seeded
 * PostgreSQL database. Exercises CRUD + domain operations for every service and
 * verifies the cross-service behavior (lead conversion, dependency guards, and
 * DB-backed reference validation). Everything created here is tracked and
 * removed in a finally block so the database is left in its seeded state.
 *
 *   npx tsx scripts/integration-test.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  activityService,
  appointmentService,
  customerService,
  dashboardService,
  invoiceService,
  leadService,
  noteService,
  reportService,
  serviceService,
  taskService,
  userService,
} from "@/services";
import { ServiceError } from "@/services/errors";

let passed = 0;
let failed = 0;

function check(label: string, cond: boolean): void {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${label}`);
  }
}

async function expectServiceError(
  label: string,
  code: string,
  fn: () => Promise<unknown>,
): Promise<void> {
  try {
    await fn();
    check(`${label} (expected ${code})`, false);
  } catch (err) {
    const ok = err instanceof ServiceError && err.code === code;
    check(`${label} -> ServiceError ${code}`, ok);
    if (!ok) console.error("    got:", err);
  }
}

// Seeded in data/organizations.ts / Milestone 2. Every service call below is
// org-scoped (Milestone 5/6), so ORG_A is threaded through the whole
// happy-path run; ORG_B is used only in the tenant-isolation sections.
const ORG_A = "org-001";
const ORG_B = "org-002";

// Real org-002 fixtures (data/*.ts), one per entity — used as the known
// cross-org targets in [12] without needing to create throwaway org-002 rows.
const ORG_B_FIXTURES = {
  lead: "lead-101",
  customer: "cust-101",
  appointment: "appt-101",
  task: "task-101",
  service: "svc-101",
  invoice: "inv-101",
  activity: "act-101",
  note: "note-101",
  user: "user-101",
};

// Track created rows for FK-safe cleanup (children first).
const created = {
  leads: new Set<string>(),
  customers: new Set<string>(),
  appointments: new Set<string>(),
  tasks: new Set<string>(),
  services: new Set<string>(),
  invoices: new Set<string>(),
  notes: new Set<string>(),
  activities: new Set<string>(),
};

async function main(): Promise<void> {
  // Two real org-001 seeded users to satisfy assignedTo FK / validation.
  const users = await prisma.users.findMany({
    where: { organization_id: ORG_A },
    take: 2,
    orderBy: { id: "asc" },
  });
  if (users.length < 1) throw new Error("No seeded org-001 users found");
  const userId = users[0].id;
  const userId2 = users[1]?.id ?? users[0].id;

  console.log("\n[1] Read / list sanity (seeded data)");
  const allLeads = await leadService.getAll(ORG_A);
  check("leads.getAll(org) > 0", allLeads.length > 0);
  const page = await leadService.list(ORG_A, { page: 1, pageSize: 5 });
  check("leads.list pageSize clamps to 5", page.data.length <= 5);
  check(
    "leads.list pagination meta",
    page.pagination.page === 1 &&
      page.pagination.pageSize === 5 &&
      page.pagination.totalItems === allLeads.length,
  );
  check("customers.getAll(org) > 0", (await customerService.getAll(ORG_A)).length > 0);
  check("appointments.getAll(org) > 0", (await appointmentService.getAll(ORG_A)).length > 0);
  check("tasks.getAll(org) > 0", (await taskService.getAll(ORG_A)).length > 0);
  check("services.getAll(org) > 0", (await serviceService.getAll(ORG_A)).length > 0);
  check("invoices.getAll(org) > 0", (await invoiceService.getAll(ORG_A)).length > 0);
  check("activities.getAll(org) > 0", (await activityService.getAll(ORG_A)).length > 0);
  check("notes.getAll(org) > 0", (await noteService.getAll(ORG_A)).length > 0);
  check("users.getAll(org) > 0", (await userService.getAll(ORG_A)).length > 0);

  console.log("\n[2] Lead CRUD + status-change activity");
  const lead = await leadService.create(ORG_A, {
    name: "IntegrationTest Lead",
    email: "itlead@example.com",
    phone: "+91 90000 00001",
    company: "IT Co",
    status: "new",
    source: "website",
    priority: "high",
    assignedTo: userId,
    tags: ["integration", "test"],
  });
  created.leads.add(lead.id);
  check("lead.create returns id", Boolean(lead.id));
  check("lead.getById matches", (await leadService.getById(ORG_A, lead.id))?.name === lead.name);
  const updatedLead = await leadService.update(ORG_A, lead.id, { status: "contacted" });
  check("lead.update status -> contacted", updatedLead?.status === "contacted");
  const timeline = await activityService.getTimeline(ORG_A, "lead", lead.id);
  const statusChange = timeline.find((a) => a.type === "status_change");
  if (statusChange) created.activities.add(statusChange.id);
  check("lead.update logged status_change activity", Boolean(statusChange));
  check(
    "lead.getByStatus contacted includes new lead",
    (await leadService.getByStatus(ORG_A, "contacted")).some((l) => l.id === lead.id),
  );
  check(
    "lead.getByAssignee includes new lead",
    (await leadService.getByAssignee(ORG_A, userId)).some((l) => l.id === lead.id),
  );
  check(
    "lead.search matches by substring",
    (await leadService.search(ORG_A, "IntegrationTest")).some((l) => l.id === lead.id),
  );

  console.log("\n[3] DB-backed reference validation (architectural fix)");
  // Customer referencing a lead created only in the DB (not in /data seed).
  const dbCustomer = await customerService.create(ORG_A, {
    leadId: lead.id,
    businessName: "DB Backed Biz",
    primaryContact: "Ref Check",
    phone: "+91 90000 00002",
    assignedTo: userId,
    lifecycleStatus: "onboarding",
  });
  created.customers.add(dbCustomer.id);
  check("customer.create against DB-only lead id succeeds", dbCustomer.leadId === lead.id);
  await expectServiceError(
    "customer.create with unknown leadId",
    "VALIDATION",
    () =>
      customerService.create(ORG_A, {
        leadId: "lead-does-not-exist",
        primaryContact: "X",
        phone: "1",
        assignedTo: userId,
        lifecycleStatus: "onboarding",
      }),
  );
  await expectServiceError(
    "lead.create with unknown assignedTo",
    "VALIDATION",
    () =>
      leadService.create(ORG_A, {
        name: "Bad",
        phone: "1",
        status: "new",
        source: "website",
        priority: "low",
        assignedTo: "user-does-not-exist",
        tags: [],
      }),
  );
  // lead now has a customer -> delete must conflict.
  await expectServiceError(
    "lead.delete blocked by converted customer",
    "CONFLICT",
    () => leadService.delete(ORG_A, lead.id),
  );
  // customer has no deps yet -> delete succeeds (cleanup of this branch).
  check("customer.delete (no deps) succeeds", (await customerService.delete(ORG_A, dbCustomer.id)) === true);
  created.customers.delete(dbCustomer.id);

  console.log("\n[4] Lead conversion migrates tasks & appointments, stamps organization_id");
  const convLead = await leadService.create(ORG_A, {
    name: "Convert Me",
    phone: "+91 90000 00003",
    status: "qualified",
    source: "referral",
    priority: "medium",
    assignedTo: userId,
    tags: [],
  });
  created.leads.add(convLead.id);
  const leadTask = await taskService.create(ORG_A, {
    title: "Follow up",
    assignedTo: userId,
    leadId: convLead.id,
    dueDate: new Date("2026-09-01T10:00:00Z"),
    priority: "high",
    status: "todo",
  });
  created.tasks.add(leadTask.id);
  const leadAppt = await appointmentService.create(ORG_A, {
    leadId: convLead.id,
    title: "Demo call",
    start: new Date("2026-09-02T10:00:00Z"),
    end: new Date("2026-09-02T11:00:00Z"),
    status: "scheduled",
    assignedTo: userId,
  });
  created.appointments.add(leadAppt.id);

  const convResult = await leadService.convert(ORG_A, convLead.id);
  created.customers.add(convResult.customer.id);
  check("convert returns customer for lead", convResult.customer.leadId === convLead.id);
  check("convert sets lead status to converted", convResult.lead.status === "converted");
  const convertedCustomerRow = await prisma.customers.findUnique({ where: { id: convResult.customer.id } });
  check("convert stamps organization_id on the new customer (Milestone 6 fix)", convertedCustomerRow?.organization_id === ORG_A);
  const custTasks = await taskService.getByCustomerId(ORG_A, convResult.customer.id);
  check("task migrated lead -> customer", custTasks.some((t) => t.id === leadTask.id));
  check(
    "migrated task cleared leadId",
    (await taskService.getById(ORG_A, leadTask.id))?.leadId === undefined,
  );
  const custAppts = await appointmentService.getByCustomerId(ORG_A, convResult.customer.id);
  check("appointment migrated lead -> customer", custAppts.some((a) => a.id === leadAppt.id));
  const convAgain = await leadService.convert(ORG_A, convLead.id);
  check("convert is idempotent", convAgain.customer.id === convResult.customer.id);
  await expectServiceError(
    "customer.delete blocked by dependent tasks/appointments",
    "CONFLICT",
    () => customerService.delete(ORG_A, convResult.customer.id),
  );

  console.log("\n[5] Task domain queries");
  const overdueTask = await taskService.create(ORG_A, {
    title: "Overdue thing",
    assignedTo: userId,
    customerId: convResult.customer.id,
    dueDate: new Date("2020-01-01T00:00:00Z"),
    priority: "high",
    status: "todo",
  });
  created.tasks.add(overdueTask.id);
  check(
    "task.getOverdue includes past-due open task",
    (await taskService.getOverdue(ORG_A)).some((t) => t.id === overdueTask.id),
  );
  check(
    "task.getOpen includes todo task",
    (await taskService.getOpen(ORG_A)).some((t) => t.id === overdueTask.id),
  );
  await expectServiceError(
    "task.create requires exactly one of lead/customer",
    "VALIDATION",
    () =>
      taskService.create(ORG_A, {
        title: "No link",
        assignedTo: userId,
        dueDate: new Date(),
        priority: "low",
        status: "todo",
      }),
  );

  console.log("\n[6] Appointment domain queries + validation");
  const futureAppt = await appointmentService.create(ORG_A, {
    customerId: convResult.customer.id,
    title: "Future review",
    start: new Date("2030-01-01T10:00:00Z"),
    end: new Date("2030-01-01T11:00:00Z"),
    status: "confirmed",
    assignedTo: userId,
  });
  created.appointments.add(futureAppt.id);
  check(
    "appointment.getUpcoming includes future confirmed appt",
    (await appointmentService.getUpcoming(ORG_A)).some((a) => a.id === futureAppt.id),
  );
  check(
    "appointment.getInRange finds appt in window",
    (await appointmentService.getInRange(
      ORG_A,
      new Date("2029-12-31T00:00:00Z"),
      new Date("2030-01-02T00:00:00Z"),
    )).some((a) => a.id === futureAppt.id),
  );
  await expectServiceError(
    "appointment.create rejects end < start",
    "VALIDATION",
    () =>
      appointmentService.create(ORG_A, {
        customerId: convResult.customer.id,
        title: "Bad range",
        start: new Date("2030-01-01T11:00:00Z"),
        end: new Date("2030-01-01T10:00:00Z"),
        status: "scheduled",
        assignedTo: userId,
      }),
  );

  console.log("\n[7] Service(svc) CRUD + getActive");
  const svc = await serviceService.create(ORG_A, {
    customerId: convResult.customer.id,
    title: "Onboarding project",
    description: "Initial setup",
    status: "in_progress",
  });
  created.services.add(svc.id);
  check("service.getActive includes in_progress svc", (await serviceService.getActive(ORG_A)).some((s) => s.id === svc.id));
  check(
    "service.getByCustomerId finds svc",
    (await serviceService.getByCustomerId(ORG_A, convResult.customer.id)).some((s) => s.id === svc.id),
  );
  const svcUpdated = await serviceService.update(ORG_A, svc.id, { status: "completed" });
  check("service.update status", svcUpdated?.status === "completed");

  console.log("\n[8] Invoice CRUD + BigInt round-trip + domain");
  const inv = await invoiceService.create(ORG_A, {
    customerId: convResult.customer.id,
    serviceId: svc.id,
    amountCents: 1234567,
    currency: "INR",
    invoiceNumber: `IT-${Date.now()}`,
    status: "sent",
    issuedAt: new Date("2026-01-01T00:00:00Z"),
    dueDate: new Date("2020-02-01T00:00:00Z"),
  });
  created.invoices.add(inv.id);
  check("invoice.amountCents is a number", typeof inv.amountCents === "number" && inv.amountCents === 1234567);
  check(
    "invoice.getByCustomerId finds invoice",
    (await invoiceService.getByCustomerId(ORG_A, convResult.customer.id)).some((i) => i.id === inv.id),
  );
  check("invoice.getUnpaid includes sent invoice", (await invoiceService.getUnpaid(ORG_A)).some((i) => i.id === inv.id));
  check(
    "invoice.getOverdue includes past-due sent invoice",
    (await invoiceService.getOverdue(ORG_A)).some((i) => i.id === inv.id),
  );
  const invUpdated = await invoiceService.update(ORG_A, inv.id, { amountCents: 999, status: "paid" });
  check("invoice.update amount round-trips", invUpdated?.amountCents === 999);
  check("invoice.getByServiceId finds invoice", (await invoiceService.getByServiceId(ORG_A, svc.id)).some((i) => i.id === inv.id));
  // A fresh, test-only invoice number, first created in org-002, then reused
  // in org-001 — must succeed: uniqueness is per-org
  // (`@@unique([organization_id, invoice_number])`), not global.
  const sharedNumber = `IT-DUP-${Date.now()}`;
  const orgBInv = await invoiceService.create(ORG_B, {
    customerId: ORG_B_FIXTURES.customer,
    amountCents: 100,
    currency: "INR",
    invoiceNumber: sharedNumber,
    status: "draft",
    issuedAt: new Date("2026-01-01T00:00:00Z"),
    dueDate: new Date("2026-02-01T00:00:00Z"),
  });
  created.invoices.add(orgBInv.id);
  const reusedNumberInv = await invoiceService.create(ORG_A, {
    customerId: convResult.customer.id,
    amountCents: 500,
    currency: "INR",
    invoiceNumber: sharedNumber,
    status: "draft",
    issuedAt: new Date("2026-01-01T00:00:00Z"),
    dueDate: new Date("2026-02-01T00:00:00Z"),
  });
  created.invoices.add(reusedNumberInv.id);
  check(
    "invoice_number is reusable across orgs (per-org unique constraint)",
    reusedNumberInv.invoiceNumber === sharedNumber,
  );
  // The per-org unique constraint still rejects a true duplicate within the
  // same org. The service layer doesn't translate this to `ServiceError`
  // itself (only the API boundary's `apiErrorResponse` maps P2002 -> 409,
  // matching every other unique constraint in this codebase — see
  // `lib/api-route.ts`); calling the service directly, as this script does
  // throughout, surfaces the raw Prisma error, so assert that instead.
  try {
    await invoiceService.create(ORG_A, {
      customerId: convResult.customer.id,
      amountCents: 100,
      currency: "INR",
      invoiceNumber: reusedNumberInv.invoiceNumber,
      status: "draft",
      issuedAt: new Date("2026-01-01T00:00:00Z"),
      dueDate: new Date("2026-02-01T00:00:00Z"),
    });
    check("duplicate invoice_number within the same org is rejected", false);
  } catch (err) {
    const isUniqueViolation =
      err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
    check("duplicate invoice_number within the same org -> P2002", isUniqueViolation);
    if (!isUniqueViolation) console.error("    got:", err);
  }

  console.log("\n[9] Note + Activity on entities");
  const note = await noteService.create(ORG_A, {
    entityType: "customer",
    entityId: convResult.customer.id,
    content: "Integration note",
    createdBy: userId2,
  });
  created.notes.add(note.id);
  check(
    "note.getForEntity returns created note",
    (await noteService.getForEntity(ORG_A, "customer", convResult.customer.id)).some((n) => n.id === note.id),
  );
  const act = await activityService.create(ORG_A, {
    entityType: "customer",
    entityId: convResult.customer.id,
    type: "call",
    description: "Called the customer",
    performedBy: userId,
    timestamp: new Date(),
  });
  created.activities.add(act.id);
  check(
    "activity.getTimeline newest-first includes new activity",
    (await activityService.getTimeline(ORG_A, "customer", convResult.customer.id))[0]?.id === act.id,
  );
  check("activity.getRecent returns items", (await activityService.getRecent(ORG_A, 5)).length > 0);
  await expectServiceError(
    "activity.create with unknown customer entity",
    "VALIDATION",
    () =>
      activityService.create(ORG_A, {
        entityType: "customer",
        entityId: "cust-nope",
        type: "call",
        description: "x",
        performedBy: userId,
        timestamp: new Date(),
      }),
  );

  console.log("\n[10] Dashboard + Report aggregators (DB-backed, org-scoped)");
  const summary = await dashboardService.getSummary(ORG_A);
  check("dashboard.leads.total > 0", summary.leads.total > 0);
  check("dashboard.invoices.paidAmountCents is number", typeof summary.invoices.paidAmountCents === "number");
  check("dashboard.recentActivities present", Array.isArray(summary.recentActivities));
  const summaryB = await dashboardService.getSummary(ORG_B);
  check(
    "dashboard.getSummary(org-002) totals differ from org-001's (not a global aggregate)",
    summaryB.leads.total !== summary.leads.total,
  );
  const report = await reportService.getSummary(ORG_A);
  check("report.conversionRate is a number 0-100", report.leads.conversionRate >= 0 && report.leads.conversionRate <= 100);
  check("report.invoices.totalBilledCents is number", typeof report.invoices.totalBilledCents === "number");
  const reportB = await reportService.getSummary(ORG_B);
  check(
    "report.getSummary(org-002) totals differ from org-001's (not a global aggregate)",
    reportB.leads.total !== report.leads.total,
  );

  console.log("\n[11] Lead tenant isolation (Milestone 5 reference implementation)");
  // lead-101 is a real seeded org-002 lead (data/leads.ts), assigned to
  // org-002's user-102 — used as the known cross-org fixture throughout.
  check(
    "leads.getAll(org-002) does not include org-001's test lead",
    !(await leadService.getAll(ORG_B)).some((l) => l.id === lead.id),
  );
  check(
    "leads.list(org-002) totalItems excludes org-001 rows",
    (await leadService.list(ORG_B)).pagination.totalItems <
      (await leadService.list(ORG_A)).pagination.totalItems,
  );
  check(
    "getById(org-001, org-002 lead) -> null (cross-org read)",
    (await leadService.getById(ORG_A, ORG_B_FIXTURES.lead)) === null,
  );
  check(
    "getById(org-002, lead-101) -> found (same-org read)",
    (await leadService.getById(ORG_B, ORG_B_FIXTURES.lead))?.id === ORG_B_FIXTURES.lead,
  );
  check(
    "update(org-001, org-002 lead) -> null, not an error",
    (await leadService.update(ORG_A, ORG_B_FIXTURES.lead, { priority: "low" })) === null,
  );
  check(
    "delete(org-001, org-002 lead) -> false, row untouched",
    (await leadService.delete(ORG_A, ORG_B_FIXTURES.lead)) === false,
  );
  check(
    "lead-101 still exists after the rejected cross-org delete",
    (await leadService.getById(ORG_B, ORG_B_FIXTURES.lead)) !== null,
  );
  await expectServiceError(
    "convert(org-001, org-002 lead) -> NOT_FOUND, not a cross-org conversion",
    "NOT_FOUND",
    () => leadService.convert(ORG_A, ORG_B_FIXTURES.lead),
  );
  await expectServiceError(
    "create(org-001, assignedTo org-002 user) -> VALIDATION",
    "VALIDATION",
    () =>
      leadService.create(ORG_A, {
        name: "Cross-org assignee",
        phone: "+91 90000 00004",
        status: "new",
        source: "website",
        priority: "low",
        assignedTo: ORG_B_FIXTURES.user, // real user, but belongs to org-002
        tags: [],
      }),
  );
  check(
    "getByStatus(org-001, converted) does not include org-002's converted lead",
    !(await leadService.getByStatus(ORG_A, "converted")).some((l) => l.id === ORG_B_FIXTURES.lead),
  );
  check(
    "search(org-001, ...) does not match an org-002-only lead's name",
    (await leadService.search(ORG_A, "Devika Rao")).length === 0,
  );
  check(
    "search(org-002, ...) matches its own lead's name",
    (await leadService.search(ORG_B, "Devika Rao")).some((l) => l.id === ORG_B_FIXTURES.lead),
  );

  console.log("\n[12] Cross-service tenant isolation (Milestone 6)");
  check(
    "customerService.getById(org-001, org-002 customer) -> null",
    (await customerService.getById(ORG_A, ORG_B_FIXTURES.customer)) === null,
  );
  check(
    "customerService.getById(org-002, its own customer) -> found",
    (await customerService.getById(ORG_B, ORG_B_FIXTURES.customer))?.id === ORG_B_FIXTURES.customer,
  );
  check(
    "appointmentService.getById(org-001, org-002 appointment) -> null",
    (await appointmentService.getById(ORG_A, ORG_B_FIXTURES.appointment)) === null,
  );
  check(
    "taskService.getById(org-001, org-002 task) -> null",
    (await taskService.getById(ORG_A, ORG_B_FIXTURES.task)) === null,
  );
  check(
    "serviceService.getById(org-001, org-002 service) -> null",
    (await serviceService.getById(ORG_A, ORG_B_FIXTURES.service)) === null,
  );
  check(
    "invoiceService.getById(org-001, org-002 invoice) -> null",
    (await invoiceService.getById(ORG_A, ORG_B_FIXTURES.invoice)) === null,
  );
  check(
    "activityService.getById(org-001, org-002 activity) -> null",
    (await activityService.getById(ORG_A, ORG_B_FIXTURES.activity)) === null,
  );
  check(
    "noteService.getById(org-001, org-002 note) -> null",
    (await noteService.getById(ORG_A, ORG_B_FIXTURES.note)) === null,
  );
  check(
    "userService.getById(org-001, org-002 user) -> null",
    (await userService.getById(ORG_A, ORG_B_FIXTURES.user)) === null,
  );
  check(
    "userService.getAll(org-001) does not include an org-002 user",
    !(await userService.getAll(ORG_A)).some((u) => u.id === ORG_B_FIXTURES.user),
  );

  await expectServiceError(
    "customerService.create(org-001, leadId of org-002 lead) -> VALIDATION",
    "VALIDATION",
    () =>
      customerService.create(ORG_A, {
        leadId: ORG_B_FIXTURES.lead,
        primaryContact: "Cross-org",
        phone: "1",
        assignedTo: userId,
        lifecycleStatus: "onboarding",
      }),
  );
  await expectServiceError(
    "serviceService.create(org-001, customerId of org-002 customer) -> VALIDATION",
    "VALIDATION",
    () =>
      serviceService.create(ORG_A, {
        customerId: ORG_B_FIXTURES.customer,
        title: "Cross-org service",
        status: "planned",
      }),
  );
  await expectServiceError(
    "invoiceService.create(org-001, customerId of org-002 customer) -> VALIDATION",
    "VALIDATION",
    () =>
      invoiceService.create(ORG_A, {
        customerId: ORG_B_FIXTURES.customer,
        amountCents: 100,
        currency: "INR",
        invoiceNumber: `CROSS-${Date.now()}`,
        status: "draft",
        issuedAt: new Date(),
        dueDate: new Date(),
      }),
  );
  await expectServiceError(
    "taskService.create(org-001, customerId of org-002 customer) -> VALIDATION",
    "VALIDATION",
    () =>
      taskService.create(ORG_A, {
        title: "Cross-org task",
        assignedTo: userId,
        customerId: ORG_B_FIXTURES.customer,
        dueDate: new Date(),
        priority: "low",
        status: "todo",
      }),
  );
  await expectServiceError(
    "appointmentService.create(org-001, customerId of org-002 customer) -> VALIDATION",
    "VALIDATION",
    () =>
      appointmentService.create(ORG_A, {
        customerId: ORG_B_FIXTURES.customer,
        title: "Cross-org appt",
        start: new Date("2030-01-01T10:00:00Z"),
        end: new Date("2030-01-01T11:00:00Z"),
        status: "scheduled",
        assignedTo: userId,
      }),
  );

  // The polymorphic-entity gap this milestone closes (plan.md §10): every
  // entityType, not just lead/customer, is now existence + org checked.
  await expectServiceError(
    "noteService.create(org-001, entityType appointment, org-002's appointment) -> VALIDATION",
    "VALIDATION",
    () =>
      noteService.create(ORG_A, {
        entityType: "appointment",
        entityId: ORG_B_FIXTURES.appointment,
        content: "Cross-org note",
        createdBy: userId,
      }),
  );
  await expectServiceError(
    "activityService.create(org-001, entityType task, org-002's task) -> VALIDATION",
    "VALIDATION",
    () =>
      activityService.create(ORG_A, {
        entityType: "task",
        entityId: ORG_B_FIXTURES.task,
        type: "updated",
        description: "Cross-org activity",
        performedBy: userId,
        timestamp: new Date(),
      }),
  );
  await expectServiceError(
    "noteService.create(org-001, entityType service, org-002's service) -> VALIDATION",
    "VALIDATION",
    () =>
      noteService.create(ORG_A, {
        entityType: "service",
        entityId: ORG_B_FIXTURES.service,
        content: "Cross-org note",
        createdBy: userId,
      }),
  );
  await expectServiceError(
    "noteService.create(org-001, entityType invoice, org-002's invoice) -> VALIDATION",
    "VALIDATION",
    () =>
      noteService.create(ORG_A, {
        entityType: "invoice",
        entityId: ORG_B_FIXTURES.invoice,
        content: "Cross-org note",
        createdBy: userId,
      }),
  );
  // Same-org appointment reference succeeds (proves the closed gap checks
  // real existence, not just "always reject").
  const sameOrgApptNote = await noteService.create(ORG_A, {
    entityType: "appointment",
    entityId: futureAppt.id,
    content: "Same-org appointment note",
    createdBy: userId,
  });
  created.notes.add(sameOrgApptNote.id);
  check("noteService.create against a same-org appointment succeeds", sameOrgApptNote.entityId === futureAppt.id);
}

async function cleanup(): Promise<void> {
  console.log("\nCleaning up created test rows …");
  // Also remove any activities/notes auto-created against our test entities.
  const entityIds = [...created.leads, ...created.customers];
  if (entityIds.length > 0) {
    await prisma.activities.deleteMany({ where: { entity_id: { in: entityIds } } });
    await prisma.notes.deleteMany({ where: { entity_id: { in: entityIds } } });
  }
  const del = async (label: string, fn: () => Promise<{ count: number }>) => {
    const { count } = await fn();
    if (count) console.log(`  removed ${count} ${label}`);
  };
  await del("activities", () => prisma.activities.deleteMany({ where: { id: { in: [...created.activities] } } }));
  await del("notes", () => prisma.notes.deleteMany({ where: { id: { in: [...created.notes] } } }));
  await del("invoices", () => prisma.invoices.deleteMany({ where: { id: { in: [...created.invoices] } } }));
  await del("services", () => prisma.services.deleteMany({ where: { id: { in: [...created.services] } } }));
  await del("tasks", () => prisma.tasks.deleteMany({ where: { id: { in: [...created.tasks] } } }));
  await del("appointments", () => prisma.appointments.deleteMany({ where: { id: { in: [...created.appointments] } } }));
  await del("customers", () => prisma.customers.deleteMany({ where: { id: { in: [...created.customers] } } }));
  await del("leads", () => prisma.leads.deleteMany({ where: { id: { in: [...created.leads] } } }));
}

main()
  .catch((error) => {
    console.error("\nTest run threw:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
    } catch (err) {
      console.error("Cleanup failed:", err);
      process.exitCode = 1;
    }
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exitCode = 1;
    await prisma.$disconnect();
  });
