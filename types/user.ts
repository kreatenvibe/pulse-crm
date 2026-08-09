// types/user.ts

import { BaseEntity } from "./common";
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