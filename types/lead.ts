import {
  BaseEntity,
  ID,
  type PaginatedResult,
  type WithIsoDates,
} from "./common";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "appointment_scheduled"
  | "converted"
  | "lost";

export type LeadSource =
  | "website"
  | "whatsapp"
  | "facebook"
  | "instagram"
  | "google"
  | "referral"
  | "walk_in"
  | "phone";

export type LeadPriority = "low" | "medium" | "high";

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
