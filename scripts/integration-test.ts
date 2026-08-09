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
  // Two real seeded users to satisfy assignedTo FK / validation.
  const users = await prisma.users.findMany({ take: 2, orderBy: { id: "asc" } });
  if (users.length < 1) throw new Error("No seeded users found");
  const userId = users[0].id;
  const userId2 = users[1]?.id ?? users[0].id;

  console.log("\n[1] Read / list sanity (seeded data)");
  const allLeads = await leadService.getAll();
  check("leads.getAll > 0", allLeads.length > 0);
  const page = await leadService.list({ page: 1, pageSize: 5 });
  check("leads.list pageSize clamps to 5", page.data.length <= 5);
  check(
    "leads.list pagination meta",
    page.pagination.page === 1 &&
      page.pagination.pageSize === 5 &&
      page.pagination.totalItems === allLeads.length,
  );
  check("customers.getAll > 0", (await customerService.getAll()).length > 0);
  check("appointments.getAll > 0", (await appointmentService.getAll()).length > 0);
  check("tasks.getAll > 0", (await taskService.getAll()).length > 0);
  check("services.getAll > 0", (await serviceService.getAll()).length > 0);
  check("invoices.getAll > 0", (await invoiceService.getAll()).length > 0);
  check("activities.getAll > 0", (await activityService.getAll()).length > 0);
  check("notes.getAll > 0", (await noteService.getAll()).length > 0);

  console.log("\n[2] Lead CRUD + status-change activity");
  const lead = await leadService.create({
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
  check("lead.getById matches", (await leadService.getById(lead.id))?.name === lead.name);
  const updatedLead = await leadService.update(lead.id, { status: "contacted" });
  check("lead.update status -> contacted", updatedLead?.status === "contacted");
  const timeline = await activityService.getTimeline("lead", lead.id);
  const statusChange = timeline.find((a) => a.type === "status_change");
  if (statusChange) created.activities.add(statusChange.id);
  check("lead.update logged status_change activity", Boolean(statusChange));
  check(
    "lead.getByStatus contacted includes new lead",
    (await leadService.getByStatus("contacted")).some((l) => l.id === lead.id),
  );
  check(
    "lead.getByAssignee includes new lead",
    (await leadService.getByAssignee(userId)).some((l) => l.id === lead.id),
  );
  check(
    "lead.search matches by substring",
    (await leadService.search("IntegrationTest")).some((l) => l.id === lead.id),
  );

  console.log("\n[3] DB-backed reference validation (architectural fix)");
  // Customer referencing a lead created only in the DB (not in /data seed).
  const dbCustomer = await customerService.create({
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
      customerService.create({
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
      leadService.create({
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
    () => leadService.delete(lead.id),
  );
  // customer has no deps yet -> delete succeeds (cleanup of this branch).
  check("customer.delete (no deps) succeeds", (await customerService.delete(dbCustomer.id)) === true);
  created.customers.delete(dbCustomer.id);

  console.log("\n[4] Lead conversion migrates tasks & appointments");
  const convLead = await leadService.create({
    name: "Convert Me",
    phone: "+91 90000 00003",
    status: "qualified",
    source: "referral",
    priority: "medium",
    assignedTo: userId,
    tags: [],
  });
  created.leads.add(convLead.id);
  const leadTask = await taskService.create({
    title: "Follow up",
    assignedTo: userId,
    leadId: convLead.id,
    dueDate: new Date("2026-09-01T10:00:00Z"),
    priority: "high",
    status: "todo",
  });
  created.tasks.add(leadTask.id);
  const leadAppt = await appointmentService.create({
    leadId: convLead.id,
    title: "Demo call",
    start: new Date("2026-09-02T10:00:00Z"),
    end: new Date("2026-09-02T11:00:00Z"),
    status: "scheduled",
    assignedTo: userId,
  });
  created.appointments.add(leadAppt.id);

  const convResult = await leadService.convert(convLead.id);
  created.customers.add(convResult.customer.id);
  check("convert returns customer for lead", convResult.customer.leadId === convLead.id);
  check("convert sets lead status to converted", convResult.lead.status === "converted");
  const custTasks = await taskService.getByCustomerId(convResult.customer.id);
  check("task migrated lead -> customer", custTasks.some((t) => t.id === leadTask.id));
  check(
    "migrated task cleared leadId",
    (await taskService.getById(leadTask.id))?.leadId === undefined,
  );
  const custAppts = await appointmentService.getByCustomerId(convResult.customer.id);
  check("appointment migrated lead -> customer", custAppts.some((a) => a.id === leadAppt.id));
  const convAgain = await leadService.convert(convLead.id);
  check("convert is idempotent", convAgain.customer.id === convResult.customer.id);
  await expectServiceError(
    "customer.delete blocked by dependent tasks/appointments",
    "CONFLICT",
    () => customerService.delete(convResult.customer.id),
  );

  console.log("\n[5] Task domain queries");
  const overdueTask = await taskService.create({
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
    (await taskService.getOverdue()).some((t) => t.id === overdueTask.id),
  );
  check(
    "task.getOpen includes todo task",
    (await taskService.getOpen()).some((t) => t.id === overdueTask.id),
  );
  await expectServiceError(
    "task.create requires exactly one of lead/customer",
    "VALIDATION",
    () =>
      taskService.create({
        title: "No link",
        assignedTo: userId,
        dueDate: new Date(),
        priority: "low",
        status: "todo",
      }),
  );

  console.log("\n[6] Appointment domain queries + validation");
  const futureAppt = await appointmentService.create({
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
    (await appointmentService.getUpcoming()).some((a) => a.id === futureAppt.id),
  );
  check(
    "appointment.getInRange finds appt in window",
    (await appointmentService.getInRange(
      new Date("2029-12-31T00:00:00Z"),
      new Date("2030-01-02T00:00:00Z"),
    )).some((a) => a.id === futureAppt.id),
  );
  await expectServiceError(
    "appointment.create rejects end < start",
    "VALIDATION",
    () =>
      appointmentService.create({
        customerId: convResult.customer.id,
        title: "Bad range",
        start: new Date("2030-01-01T11:00:00Z"),
        end: new Date("2030-01-01T10:00:00Z"),
        status: "scheduled",
        assignedTo: userId,
      }),
  );

  console.log("\n[7] Service(svc) CRUD + getActive");
  const svc = await serviceService.create({
    customerId: convResult.customer.id,
    title: "Onboarding project",
    description: "Initial setup",
    status: "in_progress",
  });
  created.services.add(svc.id);
  check("service.getActive includes in_progress svc", (await serviceService.getActive()).some((s) => s.id === svc.id));
  check(
    "service.getByCustomerId finds svc",
    (await serviceService.getByCustomerId(convResult.customer.id)).some((s) => s.id === svc.id),
  );
  const svcUpdated = await serviceService.update(svc.id, { status: "completed" });
  check("service.update status", svcUpdated?.status === "completed");

  console.log("\n[8] Invoice CRUD + BigInt round-trip + domain");
  const inv = await invoiceService.create({
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
    (await invoiceService.getByCustomerId(convResult.customer.id)).some((i) => i.id === inv.id),
  );
  check("invoice.getUnpaid includes sent invoice", (await invoiceService.getUnpaid()).some((i) => i.id === inv.id));
  check(
    "invoice.getOverdue includes past-due sent invoice",
    (await invoiceService.getOverdue()).some((i) => i.id === inv.id),
  );
  const invUpdated = await invoiceService.update(inv.id, { amountCents: 999, status: "paid" });
  check("invoice.update amount round-trips", invUpdated?.amountCents === 999);
  check("invoice.getByServiceId finds invoice", (await invoiceService.getByServiceId(svc.id)).some((i) => i.id === inv.id));

  console.log("\n[9] Note + Activity on entities");
  const note = await noteService.create({
    entityType: "customer",
    entityId: convResult.customer.id,
    content: "Integration note",
    createdBy: userId2,
  });
  created.notes.add(note.id);
  check(
    "note.getForEntity returns created note",
    (await noteService.getForEntity("customer", convResult.customer.id)).some((n) => n.id === note.id),
  );
  const act = await activityService.create({
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
    (await activityService.getTimeline("customer", convResult.customer.id))[0]?.id === act.id,
  );
  check("activity.getRecent returns items", (await activityService.getRecent(5)).length > 0);
  await expectServiceError(
    "activity.create with unknown customer entity",
    "VALIDATION",
    () =>
      activityService.create({
        entityType: "customer",
        entityId: "cust-nope",
        type: "call",
        description: "x",
        performedBy: userId,
        timestamp: new Date(),
      }),
  );

  console.log("\n[10] Dashboard + Report aggregators (DB-backed)");
  const summary = await dashboardService.getSummary();
  check("dashboard.leads.total > 0", summary.leads.total > 0);
  check("dashboard.invoices.paidAmountCents is number", typeof summary.invoices.paidAmountCents === "number");
  check("dashboard.recentActivities present", Array.isArray(summary.recentActivities));
  const report = await reportService.getSummary();
  check("report.conversionRate is a number 0-100", report.leads.conversionRate >= 0 && report.leads.conversionRate <= 100);
  check("report.invoices.totalBilledCents is number", typeof report.invoices.totalBilledCents === "number");
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
