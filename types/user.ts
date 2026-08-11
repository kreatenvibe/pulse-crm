// types/user.ts

import { BaseEntity, type WithIsoDates } from "./common";
import type { UserRole } from "@/lib/schemas/enums";

// Source of truth: lib/schemas/enums.ts.
export type { UserRole };

export interface User extends BaseEntity {
  name: string;
  email: string;
  avatar?: string;

  role: UserRole;

  isActive: boolean;
}

/** User as returned by `/api/users` (dates are ISO strings). */
export type UserDto = WithIsoDates<User>;