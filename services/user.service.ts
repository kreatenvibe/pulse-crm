import { prisma } from "@/lib/prisma";
import type { users as UserRow } from "@/lib/generated/prisma/client";
import type { ID } from "@/types/common";
import type { User, UserRole } from "@/types/user";

/** Stable order: zero-padded ids sort identically to the original /data array. */
const ORDER_BY_ID = { id: "asc" } as const;

/** Map a Prisma `users` row (snake_case, nullable) to the domain `User`. */
function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar ?? undefined,
    role: row.role as UserRole,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class UserService {
  /**
   * Full user list for assignment pickers. Returns everyone (including inactive
   * users) so edit forms can still resolve a record already assigned to an
   * inactive user; the UI decides how to present them.
   */
  async getAll(): Promise<User[]> {
    const rows = await prisma.users.findMany({ orderBy: ORDER_BY_ID });
    return rows.map(toUser);
  }

  async getById(id: ID): Promise<User | null> {
    const row = await prisma.users.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  }
}

export const userService = new UserService();
