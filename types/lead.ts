import {
  BaseEntity,
  ID,
  type PaginatedResult,
  type WithIsoDates,
} from "./common";
import type {
  LeadPriority,
  LeadSource,
  LeadStatus,
} from "@/lib/schemas/enums";

// Domain vocabularies are defined once in lib/schemas/enums.ts (the runtime
// source of truth) and re-exported here so consumers keep importing from types/.
export type { LeadPriority, LeadSource, LeadStatus };

export interface Lead extends BaseEntity {
  // Person
  name: string;
  email?: string;
  phone: string;
  company?: string;

  // CRM
  status: LeadStatus;
  source: LeadSource;
  priority: LeadPriority;

  // Ownership
  assignedTo: ID;

  // Context
  message?: string;
  tags: string[];

  // Timeline
  lastContactedAt?: Date;
}

/** Lead as returned by `/api/leads` full list (dates are ISO strings). */
export type LeadDto = WithIsoDates<Lead>;

/** Paginated lead list from `GET /api/leads?page=&pageSize=`. */
export type PaginatedLeadsDto = PaginatedResult<LeadDto>;
