/**
 * HTTP-level tenant-isolation check for Milestone 6, extending
 * `lead-http-test.ts`'s proven pattern (real signup, real cookie, real
 * fetch) to the aggregate/high-risk surfaces plan.md §9 calls out by name:
 * `userService.getAll` (every assignee picker), and
 * `dashboardService`/`reportService`'s 12+5 call fan-out. Stands in for
 * "manual two-session browser walkthrough of every dashboard page"
 * (plan.md §15/Milestone 6) in an environment with no browser available.
 *
 * Requires a running server (`npm run dev` or `next start`). Set BASE_URL to
 * override the default `http://localhost:3000`.
 *
 *   npx tsx scripts/tenant-isolation-http-test.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

let passed = 0;
let failed = 0;

function check(label: string, cond: boolean, extra?: unknown): void {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${label}`);
    if (extra !== undefined) console.error("    got:", extra);
  }
}

type Session = { cookie: string; userId: string; organizationId: string };

async function signup(stamp: number, tag: string): Promise<Session> {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: `Tenant HTTP Test ${tag}`,
      email: `tenant-http-${tag}-${stamp}@example.com`,
      password: "correct-horse-battery",
      organizationName: `Tenant HTTP Org ${tag} ${stamp}`,
    }),
  });
  if (res.status !== 201) throw new Error(`signup(${tag}) failed: ${res.status}`);
  const body = await res.json();
  const cookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
  return { cookie, userId: body.data.id, organizationId: body.data.organizationId };
}

async function createCustomerDirect(session: Session, name: string): Promise<{ leadId: string; customerId: string }> {
  const leadRes = await fetch(`${BASE_URL}/api/leads`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: session.cookie },
    body: JSON.stringify({
      name,
      phone: "+91 90000 77777",
      status: "qualified",
      source: "website",
      priority: "medium",
      assignedTo: session.userId,
      tags: [],
    }),
  });
  if (leadRes.status !== 201) throw new Error(`lead create failed: ${leadRes.status}`);
  const lead = (await leadRes.json()).data;

  const convertRes = await fetch(`${BASE_URL}/api/leads/${lead.id}/convert`, {
    method: "POST",
    headers: { cookie: session.cookie },
  });
  if (convertRes.status !== 200) throw new Error(`convert failed: ${convertRes.status}`);
  const converted = (await convertRes.json()).data;
  return { leadId: lead.id, customerId: converted.customer.id };
}

async function main(): Promise<void> {
  const stamp = Date.now();

  console.log(`\nTargeting ${BASE_URL} — make sure a dev/prod server is running.`);
  const sessionA = await signup(stamp, "a");
  const sessionB = await signup(stamp, "b");

  try {
    console.log("\n[1] Each org converts a lead into a customer (via HTTP)");
    const orgA = await createCustomerDirect(sessionA, "Org A Prospect");
    const orgB = await createCustomerDirect(sessionB, "Org B Prospect");
    check("org A's lead converted to a customer", Boolean(orgA.customerId));
    check("org B's lead converted to a customer", Boolean(orgB.customerId));

    console.log("\n[2] The converted customer carries the right organization_id (Milestone 6 fix)");
    const rowA = await prisma.customers.findUnique({ where: { id: orgA.customerId } });
    const rowB = await prisma.customers.findUnique({ where: { id: orgB.customerId } });
    check("org A's converted customer row has organization_id = org A", rowA?.organization_id === sessionA.organizationId);
    check("org B's converted customer row has organization_id = org B", rowB?.organization_id === sessionB.organizationId);

    console.log("\n[3] GET /api/customers is isolated per org");
    const custListA = await (await fetch(`${BASE_URL}/api/customers`, { headers: { cookie: sessionA.cookie } })).json();
    const custListB = await (await fetch(`${BASE_URL}/api/customers`, { headers: { cookie: sessionB.cookie } })).json();
    check("org A's customer list includes its own customer", custListA.data.some((c: { id: string }) => c.id === orgA.customerId));
    check("org A's customer list excludes org B's customer", !custListA.data.some((c: { id: string }) => c.id === orgB.customerId));
    check("org B's customer list includes its own customer", custListB.data.some((c: { id: string }) => c.id === orgB.customerId));
    check("org B's customer list excludes org A's customer", !custListB.data.some((c: { id: string }) => c.id === orgA.customerId));

    console.log("\n[4] GET /api/customers/[id] cross-org -> 404");
    const crossCust = await fetch(`${BASE_URL}/api/customers/${orgA.customerId}`, { headers: { cookie: sessionB.cookie } });
    check("GET org A's customer as org B -> 404", crossCust.status === 404, crossCust.status);

    console.log("\n[5] GET /api/users only shows the caller's own org");
    const usersA = await (await fetch(`${BASE_URL}/api/users`, { headers: { cookie: sessionA.cookie } })).json();
    const usersB = await (await fetch(`${BASE_URL}/api/users`, { headers: { cookie: sessionB.cookie } })).json();
    check("org A's user list includes its own user", usersA.data.some((u: { id: string }) => u.id === sessionA.userId));
    check("org A's user list excludes org B's user", !usersA.data.some((u: { id: string }) => u.id === sessionB.userId));
    check("org B's user list includes its own user", usersB.data.some((u: { id: string }) => u.id === sessionB.userId));
    check("org B's user list excludes org A's user", !usersB.data.some((u: { id: string }) => u.id === sessionA.userId));

    console.log("\n[6] GET /api/dashboard and /api/reports are per-org aggregates");
    const dashA = await (await fetch(`${BASE_URL}/api/dashboard`, { headers: { cookie: sessionA.cookie } })).json();
    const dashB = await (await fetch(`${BASE_URL}/api/dashboard`, { headers: { cookie: sessionB.cookie } })).json();
    check("dashboard.leads.total counts only org A's lead", dashA.data.leads.total === 1);
    check("dashboard.leads.total counts only org B's lead", dashB.data.leads.total === 1);
    check("dashboard.customers.total counts only org A's customer", dashA.data.customers.total === 1);

    const reportA = await (await fetch(`${BASE_URL}/api/reports`, { headers: { cookie: sessionA.cookie } })).json();
    check("report.leads.total counts only org A's lead", reportA.data.leads.total === 1);
    check("report.leads.conversionRate reflects org A's 1-of-1 converted lead", reportA.data.leads.conversionRate === 100);

    console.log("\n[7] No session -> 401 for every one of these routes");
    for (const path of ["/api/customers", "/api/users", "/api/dashboard", "/api/reports"]) {
      const res = await fetch(`${BASE_URL}${path}`);
      check(`GET ${path} (no cookie) -> 401`, res.status === 401, res.status);
    }
  } finally {
    for (const orgId of [sessionA.organizationId, sessionB.organizationId]) {
      await prisma.activities.deleteMany({ where: { organization_id: orgId } });
      await prisma.notes.deleteMany({ where: { organization_id: orgId } });
      await prisma.tasks.deleteMany({ where: { organization_id: orgId } });
      await prisma.appointments.deleteMany({ where: { organization_id: orgId } });
      await prisma.invoices.deleteMany({ where: { organization_id: orgId } });
      await prisma.services.deleteMany({ where: { organization_id: orgId } });
      await prisma.customers.deleteMany({ where: { organization_id: orgId } });
      await prisma.leads.deleteMany({ where: { organization_id: orgId } });
    }
    await prisma.sessions.deleteMany({ where: { user_id: { in: [sessionA.userId, sessionB.userId] } } });
    await prisma.users.deleteMany({ where: { id: { in: [sessionA.userId, sessionB.userId] } } });
    await prisma.organizations.deleteMany({ where: { id: { in: [sessionA.organizationId, sessionB.organizationId] } } });
  }
}

main()
  .catch((error) => {
    console.error("\nTest run threw:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exitCode = 1;
    await prisma.$disconnect();
  });
