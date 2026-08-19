import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { users as UserRow } from "@/lib/generated/prisma/client";
import type { ID } from "@/types/common";
import type { User, UserRole } from "@/types/user";
import {
  LoginSchema,
  SignupSchema,
  type LoginInput,
  type SignupInput,
} from "@/lib/schemas/auth.schema";
import { conflict, unauthorized } from "./errors";
import { nextId, now } from "./helpers";
import { parseInput } from "./parse";

export type { LoginInput, SignupInput };

/**
 * Signup/login/logout and PostgreSQL-backed session issuance.
 *
 * A distinct service (not folded into `user.service.ts`) because it touches
 * two tables at once (`organizations` + `users`) and has a fundamentally
 * different shape from entity CRUD — see plan.md §7/Milestone 3.
 *
 * Session *resolution* for already-authenticated requests (reading the
 * cookie off an incoming `Request`, wiring it into every other route,
 * `middleware.ts`) is a later milestone. `getSessionContext` below is the
 * DB-backed lookup that milestone will call — it lives here, not in a
 * transport-layer file, because "does this session exist and is it still
 * valid" is a database question, consistent with how every other DB-backed
 * check in this codebase lives in `services/`.
 */

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
}

export interface SessionContext {
  userId: ID;
  organizationId: ID;
  role: UserRole;
}

/** Map a Prisma `users` row (snake_case, nullable) to the domain `User`. Never includes `password_hash`. */
function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar ?? undefined,
    role: row.role as UserRole,
    isActive: row.is_active,
    organizationId: row.organization_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createSession(userId: ID): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.sessions.create({
    data: { id: token, user_id: userId, expires_at: expiresAt },
  });
  return { token, expiresAt };
}

class AuthService {
  /**
   * Signup always creates a brand-new organization together with its first
   * user (role `admin`) — there is no invitation system yet, so there is no
   * other mechanism by which a signup could join an existing org. See
   * plan.md §4.11 / §19.
   */
  async signup(data: SignupInput): Promise<AuthSession> {
    const input = parseInput(SignupSchema, data);

    const existing = await prisma.users.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existing) {
      throw conflict("An account with this email already exists");
    }

    const passwordHash = await hashPassword(input.password);
    const timestamp = now();

    const existingOrgs = await prisma.organizations.findMany({ select: { id: true } });
    const organizationId = nextId("org", existingOrgs);
    const organization = await prisma.organizations.create({
      data: {
        id: organizationId,
        name: input.organizationName,
        created_at: timestamp,
        updated_at: timestamp,
      },
    });

    const existingUsers = await prisma.users.findMany({ select: { id: true } });
    const userId = nextId("user", existingUsers);
    const userRow = await prisma.users.create({
      data: {
        id: userId,
        name: input.name,
        email: input.email,
        role: "admin",
        is_active: true,
        organization_id: organization.id,
        password_hash: passwordHash,
        created_at: timestamp,
        updated_at: timestamp,
      },
    });

    const session = await createSession(userRow.id);
    return { user: toUser(userRow), token: session.token, expiresAt: session.expiresAt };
  }

  /**
   * A single generic `UNAUTHORIZED` for unknown email, wrong password, and
   * deactivated users alike — never reveal which case occurred.
   */
  async login(data: LoginInput): Promise<AuthSession> {
    const input = parseInput(LoginSchema, data);

    const row = await prisma.users.findUnique({ where: { email: input.email } });
    const passwordOk = row?.password_hash
      ? await verifyPassword(input.password, row.password_hash)
      : false;

    if (!row || !row.is_active || !passwordOk) {
      throw unauthorized("Invalid email or password");
    }

    const session = await createSession(row.id);
    return { user: toUser(row), token: session.token, expiresAt: session.expiresAt };
  }

  /** Deletes the session row server-side. Missing/already-deleted token is a no-op, not an error. */
  async logout(token: string | undefined | null): Promise<void> {
    if (!token) return;
    await prisma.sessions.deleteMany({ where: { id: token } });
  }

  /**
   * Resolve an opaque session token to `{ userId, organizationId, role }`.
   * Throws `UNAUTHORIZED` for a missing, unknown, expired session, or a
   * session whose user was deactivated after the session was issued.
   */
  async getSessionContext(token: string | undefined | null): Promise<SessionContext> {
    if (!token) {
      throw unauthorized("Not authenticated");
    }

    const session = await prisma.sessions.findUnique({
      where: { id: token },
      include: { user: true },
    });

    if (
      !session ||
      session.expires_at <= now() ||
      !session.user.is_active ||
      !session.user.organization_id
    ) {
      throw unauthorized("Not authenticated");
    }

    return {
      userId: session.user.id,
      organizationId: session.user.organization_id,
      role: session.user.role as UserRole,
    };
  }
}

export const authService = new AuthService();
