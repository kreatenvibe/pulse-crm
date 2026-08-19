/**
 * Integration tests for the authentication foundation (Milestone 3):
 * password hashing, signup, login, logout, and PostgreSQL-backed sessions.
 * Exercises `services/auth.service.ts` directly against the live seeded
 * database, mirroring the existing `scripts/integration-test.ts` harness
 * (`check()` / `expectServiceError()`, tracked-and-cleaned-up created rows).
 *
 *   npx tsx scripts/auth-integration-test.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services";
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

// Track created rows for cleanup (sessions cascade-delete with their user,
// but are also deleted directly wherever a test needs them gone early).
const created = {
  organizations: new Set<string>(),
  users: new Set<string>(),
  sessions: new Set<string>(),
};

async function main(): Promise<void> {
  const stamp = Date.now();

  console.log("\n[1] Signup: creates organization + user + session");
  const signupEmail = `it-signup-${stamp}@example.com`;
  const signup = await authService.signup({
    name: "Integration Signup",
    email: signupEmail,
    password: "correct-horse-battery",
    organizationName: `IT Org ${stamp}`,
  });
  created.users.add(signup.user.id);
  created.sessions.add(signup.token);

  check("signup returns a user id", Boolean(signup.user.id));
  check("signup user has organizationId resolved", Boolean(signup.user.organizationId));
  check("signup response has no password_hash field", !("passwordHash" in signup.user) && !("password_hash" in signup.user));
  check("signup issues an opaque session token", typeof signup.token === "string" && signup.token.length >= 32);
  check("signup session expiresAt is in the future", signup.expiresAt.getTime() > Date.now());

  const orgRow = await prisma.organizations.findUnique({ where: { id: signup.user.organizationId! } });
  if (orgRow) created.organizations.add(orgRow.id);
  check("signup created a real organizations row", Boolean(orgRow));

  const userRow = await prisma.users.findUnique({ where: { id: signup.user.id } });
  check("password is never stored plaintext", Boolean(userRow?.password_hash) && userRow!.password_hash !== "correct-horse-battery");
  check(
    "stored hash looks like a bcrypt hash, not plaintext",
    /^\$2[aby]\$\d{2}\$/.test(userRow?.password_hash ?? ""),
  );

  console.log("\n[2] Duplicate email is rejected");
  await expectServiceError("signup with duplicate email", "CONFLICT", () =>
    authService.signup({
      name: "Duplicate",
      email: signupEmail,
      password: "another-password",
      organizationName: "Duplicate Org",
    }),
  );

  console.log("\n[3] Login: success, wrong password, unknown email");
  const login = await authService.login({ email: signupEmail, password: "correct-horse-battery" });
  created.sessions.add(login.token);
  check("login returns the same user", login.user.id === signup.user.id);
  check("login issues a new session token", login.token !== signup.token);
  check("login response has no password_hash field", !("passwordHash" in login.user) && !("password_hash" in login.user));

  await expectServiceError("login with wrong password", "UNAUTHORIZED", () =>
    authService.login({ email: signupEmail, password: "wrong-password" }),
  );
  await expectServiceError("login with unknown email", "UNAUTHORIZED", () =>
    authService.login({ email: `nobody-${stamp}@example.com`, password: "whatever123" }),
  );

  console.log("\n[4] Deactivated user cannot log in");
  await prisma.users.update({ where: { id: signup.user.id }, data: { is_active: false } });
  await expectServiceError("login as deactivated user", "UNAUTHORIZED", () =>
    authService.login({ email: signupEmail, password: "correct-horse-battery" }),
  );
  await prisma.users.update({ where: { id: signup.user.id }, data: { is_active: true } });

  console.log("\n[5] Session lookup + organizationId resolution");
  const ctx = await authService.getSessionContext(login.token);
  check("getSessionContext resolves userId", ctx.userId === signup.user.id);
  check("getSessionContext resolves organizationId", ctx.organizationId === signup.user.organizationId);
  check("getSessionContext resolves role", ctx.role === "admin");

  console.log("\n[6] Session expiration");
  const expiredToken = `it-expired-${stamp}`;
  await prisma.sessions.create({
    data: {
      id: expiredToken,
      user_id: signup.user.id,
      expires_at: new Date(Date.now() - 1000),
    },
  });
  created.sessions.add(expiredToken);
  await expectServiceError("expired session cannot authenticate", "UNAUTHORIZED", () =>
    authService.getSessionContext(expiredToken),
  );

  console.log("\n[7] Logout invalidates the session");
  const preLogout = await prisma.sessions.findUnique({ where: { id: login.token } });
  check("session row exists before logout", Boolean(preLogout));
  await authService.logout(login.token);
  const postLogout = await prisma.sessions.findUnique({ where: { id: login.token } });
  check("session row is deleted after logout", postLogout === null);
  await expectServiceError("logged-out session cannot authenticate", "UNAUTHORIZED", () =>
    authService.getSessionContext(login.token),
  );
  created.sessions.delete(login.token);

  console.log("\n[8] Invalid / missing session cannot authenticate");
  await expectServiceError("garbage session token", "UNAUTHORIZED", () =>
    authService.getSessionContext("not-a-real-token"),
  );
  await expectServiceError("missing session token", "UNAUTHORIZED", () =>
    authService.getSessionContext(undefined),
  );

  console.log("\n[9] logout() is a safe no-op for an already-invalid token");
  await authService.logout("not-a-real-token"); // must not throw
  check("logout of unknown token does not throw", true);

  console.log("\n[10] Existing seeded users are unaffected");
  const existingUser = await prisma.users.findUnique({ where: { id: "user-001" } });
  check("pre-existing seeded user row is untouched", existingUser?.email === "priya.sharma@pulsecrm.in");
}

async function cleanup(): Promise<void> {
  console.log("\nCleaning up created test rows …");
  const del = async (label: string, fn: () => Promise<{ count: number }>) => {
    const { count } = await fn();
    if (count) console.log(`  removed ${count} ${label}`);
  };
  await del("sessions", () => prisma.sessions.deleteMany({ where: { id: { in: [...created.sessions] } } }));
  await del("users", () => prisma.users.deleteMany({ where: { id: { in: [...created.users] } } }));
  await del("organizations", () => prisma.organizations.deleteMany({ where: { id: { in: [...created.organizations] } } }));
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
