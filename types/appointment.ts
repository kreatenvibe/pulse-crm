import { BaseEntity, ID, type WithIsoDates } from "./common";
import type { AppointmentStatus } from "@/lib/schemas/enums";

// Source of truth: lib/schemas/enums.ts.
export type { AppointmentStatus };

export interface Appointment extends BaseEntity {
  leadId?: ID;
  customerId?: ID;

  title: string;
  start: Date;
  end: Date;
  status: AppointmentStatus;

  assignedTo: ID;
  notes?: string;

  /** Optional until Milestone 5/6 thread org scoping through the service layer. */
  organizationId?: ID;
}

/** Appointment as returned by API JSON (dates are ISO strings). */
export type AppointmentDto = WithIsoDates<Appointment>;

