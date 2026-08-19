/**
 * HTTP-level tests for Milestone 4 (session resolution + proxy gating):
 * no cookie / invalid cookie / expired session cases against the one
 * smoke-test route (`GET /api/dashboard`) and the `proxy.ts` page redirect,
 * per plan.md §15's "HTTP-level checks" — a lightweight `fetch`-based pass,
 * same dependency-free style as the rest of `scripts/`, no Playwright/Supertest.
 *
 * Requires a running server (`npm run dev` or `next start`) — set BASE_URL to
 * point elsewhere if not on the default port.
 *
 *   npx tsx scripts/session-http-test.ts
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

async function main(): Promise<void> {
  const stamp = Date.now();

  console.log(`\nTargeting ${BASE_URL} — make sure a dev/prod server is running.`);

  console.log("\n[1] Public pages/routes are never gated");
  const home = await fetch(`${BASE_URL}/`, { redirect: "manual" });
  check("GET / -> 200 (no redirect)", home.status === 200);
  const loginPage = await fetch(`${BASE_URL}/login`, { redirect: "manual" });
  check("GET /login -> 200 (no redirect)", loginPage.status === 200);

  console.log("\n[2] Dashboard page redirects to /login without a session cookie");
  const dashboardPage = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
  check("GET /dashboard (no cookie) -> 307", dashboardPage.status === 307, dashboardPage.status);
  check(
    "GET /dashboard (no cookie) -> Location: /login",
    new URL(dashboardPage.headers.get("location") ?? "", BASE_URL).pathname === "/login",
  );

  console.log("\n[3] /api/dashboard requires a real session (401, not a redirect)");
  const noCookie = await fetch(`${BASE_URL}/api/dashboard`);
  check("GET /api/dashboard (no cookie) -> 401", noCookie.status === 401, noCookie.status);
  const noCookieBody = await noCookie.json();
  check("401 body uses the standard error envelope", noCookieBody.success === false);

  const garbageCookie = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: { cookie: "pulse_session=not-a-real-token" },
  });
  check("GET /api/dashboard (garbage cookie) -> 401", garbageCookie.status === 401, garbageCookie.status);

  console.log("\n[4] Expired session cannot authenticate over HTTP");
  const users = await prisma.users.findMany({ take: 1, orderBy: { id: "asc" } });
  if (users.length === 0) throw new Error("No seeded users found");
  const expiredToken = `http-expired-${stamp}`;
  await prisma.sessions.create({
    data: { id: expiredToken, user_id: users[0].id, expires_at: new Date(Date.now() - 1000) },
  });
  try {
    const expired = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: { cookie: `pulse_session=${expiredToken}` },
    });
    check("GET /api/dashboard (expired session) -> 401", expired.status === 401, expired.status);
  } finally {
    await prisma.sessions.deleteMany({ where: { id: expiredToken } });
  }

  console.log("\n[5] A real session authenticates both the page and the API route");
  const email = `http-session-${stamp}@example.com`;
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "HTTP Session Test",
      email,
      password: "correct-horse-battery",
      organizationName: `HTTP Session Org ${stamp}`,
    }),
  });
  const signupBody = await signupRes.json();
  check("signup -> 201", signupRes.status === 201, signupRes.status);
  const setCookie = signupRes.headers.get("set-cookie") ?? "";
  const cookiePair = setCookie.split(";")[0];
  check("signup sets the session cookie", cookiePair.startsWith("pulse_session="));

  try {
    const authedDashboardPage = await fetch(`${BASE_URL}/dashboard`, {
      headers: { cookie: cookiePair },
      redirect: "manual",
    });
    check("GET /dashboard (valid cookie) -> 200 (no redirect)", authedDashboardPage.status === 200, authedDashboardPage.status);

    const authedApi = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: { cookie: cookiePair },
    });
    check("GET /api/dashboard (valid cookie) -> 200", authedApi.status === 200, authedApi.status);
    const authedBody = await authedApi.json();
    check("GET /api/dashboard (valid cookie) -> summary payload", authedBody.success === true && typeof authedBody.data?.leads?.total === "number");

    console.log("\n[6] Logout invalidates the session for subsequent requests");
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { cookie: cookiePair },
    });
    check("logout -> 204", logoutRes.status === 204, logoutRes.status);

    const afterLogout = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: { cookie: cookiePair },
    });
    check("GET /api/dashboard (post-logout cookie) -> 401", afterLogout.status === 401, afterLogout.status);
  } finally {
    // The route/HTTP surface has no delete-user endpoint (out of scope);
    // clean up the signup's rows directly, same as the DB-backed test scripts.
    const userId = signupBody?.data?.id as string | undefined;
    const organizationId = signupBody?.data?.organizationId as string | undefined;
    if (userId) {
      await prisma.sessions.deleteMany({ where: { user_id: userId } });
      await prisma.users.deleteMany({ where: { id: userId } });
    }
    if (organizationId) {
      await prisma.organizations.deleteMany({ where: { id: organizationId } });
    }
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
