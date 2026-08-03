// types/user.ts

import { BaseEntity } from "./common";

export type UserRole = "admin" | "manager" | "sales";

export interface User extends BaseEntity {
  name: string;
  email: string;
  avatar?: string;

  role: UserRole;

  isActive: boolean;
}