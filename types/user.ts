// types/user.ts

import { BaseEntity, ID, type WithIsoDates } from "./common";
import type { UserRole } from "@/lib/schemas/enums";

// Source of truth: lib/schemas/enums.ts.
export type { UserRole };

export interface User extends BaseEntity {
  name: string;
  email: string;
  avatar?: string;

  role: UserRole;

  isActive: boolean;

  /** Optional until Milestone 5/6 thread org scoping through the service layer. */
  organizationId?: ID;
}

/** User as returned by `/api/users` (dates are ISO strings). */
export type UserDto = WithIsoDates<User>;