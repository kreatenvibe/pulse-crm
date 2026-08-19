/**
 * HTTP-level tenant-isolation check for Milestone 5's reference
 * implementation (leads). Stands in for "log in as org A and org B in two
 * browser sessions and compare `/leads`" (plan.md §15/Milestone 5) — signs
 * up two fresh orgs via the real `/api/auth/signup` endpoint, then drives
 * `/api/leads*` with each session's cookie to prove org A can never see,
 * update, or delete org B's lead (and vice versa) over real HTTP, not just
 * direct service calls.
 *
 * Requires a running server (`npm run dev` or `next start`). Set BASE_URL to
 * override the default `http://localhost:3000`.
 *
 *   npx tsx scripts/lead-http-test.ts
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
      name: `Lead HTTP Test ${tag}`,
      email: `lead-http-${tag}-${stamp}@example.com`,
      password: "correct-horse-battery",
      organizationName: `Lead HTTP Org ${tag} ${stamp}`,
    }),
  });
  if (res.status !== 201) throw new Error(`signup(${tag}) failed: ${res.status}`);
  const body = await res.json();
  const cookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
  return { cookie, userId: body.data.id, organizationId: body.data.organizationId };
}

async function createLead(session: Session, name: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/leads`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: session.cookie },
    body: JSON.stringify({
      name,
      phone: "+91 90000 55555",
      status: "new",
      source: "website",
      priority: "medium",
      assignedTo: session.userId,
      tags: [],
    }),
  });
  if (res.status !== 201) throw new Error(`createLead failed: ${res.status}`);
  const body = await res.json();
  return body.data.id as string;
}

async function main(): Promise<void> {
  const stamp = Date.now();

  console.log(`\nTargeting ${BASE_URL} — make sure a dev/prod server is running.`);
  const sessionA = await signup(stamp, "a");
  const sessionB = await signup(stamp, "b");

  try {
    console.log("\n[1] Each org creates its own lead");
    const leadAId = await createLead(sessionA, "Org A Lead");
    const leadBId = await createLead(sessionB, "Org B Lead");
    check("org A's lead was created", Boolean(leadAId));
    check("org B's lead was created", Boolean(leadBId));

    console.log("\n[2] GET /api/leads is isolated per org");
    const listA = await (await fetch(`${BASE_URL}/api/leads`, { headers: { cookie: sessionA.cookie } })).json();
    const listB = await (await fetch(`${BASE_URL}/api/leads`, { headers: { cookie: sessionB.cookie } })).json();
    check("org A's list includes its own lead", listA.data.some((l: { id: string }) => l.id === leadAId));
    check("org A's list excludes org B's lead", !listA.data.some((l: { id: string }) => l.id === leadBId));
    check("org B's list includes its own lead", listB.data.some((l: { id: string }) => l.id === leadBId));
    check("org B's list excludes org A's lead", !listB.data.some((l: { id: string }) => l.id === leadAId));

    console.log("\n[3] Cross-org GET/PATCH/DELETE by id all 404 (never 403, never leak existence)");
    const crossGet = await fetch(`${BASE_URL}/api/leads/${leadAId}`, { headers: { cookie: sessionB.cookie } });
    check("GET org A's lead as org B -> 404", crossGet.status === 404, crossGet.status);

    const crossPatch = await fetch(`${BASE_URL}/api/leads/${leadAId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie: sessionB.cookie },
      body: JSON.stringify({ priority: "high" }),
    });
    check("PATCH org A's lead as org B -> 404", crossPatch.status === 404, crossPatch.status);

    const crossDelete = await fetch(`${BASE_URL}/api/leads/${leadAId}`, {
      method: "DELETE",
      headers: { cookie: sessionB.cookie },
    });
    check("DELETE org A's lead as org B -> 404", crossDelete.status === 404, crossDelete.status);

    const stillThere = await fetch(`${BASE_URL}/api/leads/${leadAId}`, { headers: { cookie: sessionA.cookie } });
    check("org A's lead survives the rejected cross-org delete", stillThere.status === 200, stillThere.status);

    console.log("\n[4] Cross-org convert also 404s");
    const crossConvert = await fetch(`${BASE_URL}/api/leads/${leadAId}/convert`, {
      method: "POST",
      headers: { cookie: sessionB.cookie },
    });
    check("POST convert org A's lead as org B -> 404", crossConvert.status === 404, crossConvert.status);

    console.log("\n[5] Client-supplied organizationId in the body is ignored");
    const spoofRes = await fetch(`${BASE_URL}/api/leads`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: sessionA.cookie },
      body: JSON.stringify({
        name: "Spoof Attempt",
        phone: "+91 90000 66666",
        status: "new",
        source: "website",
        priority: "low",
        assignedTo: sessionA.userId,
        tags: [],
        organizationId: sessionB.organizationId, // must be stripped/ignored by Zod
      }),
    });
    const spoofBody = await spoofRes.json();
    check("spoofed create -> 201", spoofRes.status === 201, spoofRes.status);
    const spoofRow = await prisma.leads.findUnique({ where: { id: spoofBody.data.id } });
    check(
      "created row's organization_id is the caller's real org, not the spoofed one",
      spoofRow?.organization_id === sessionA.organizationId,
    );
    await prisma.leads.deleteMany({ where: { id: spoofBody.data.id } });

    console.log("\n[6] No session at all -> 401, not a redirect, not leaked data");
    const noSession = await fetch(`${BASE_URL}/api/leads`);
    check("GET /api/leads (no cookie) -> 401", noSession.status === 401, noSession.status);
  } finally {
    await prisma.leads.deleteMany({ where: { organization_id: { in: [sessionA.organizationId, sessionB.organizationId] } } });
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
