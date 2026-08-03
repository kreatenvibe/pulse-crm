import { BaseEntity, ID, type WithIsoDates } from "./common";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Appointment extends BaseEntity {
  // TODO: XOR — exactly one of leadId or customerId must be present (enforce at DB/API later).
  leadId?: ID;
  customerId?: ID;

  title: string;
  start: Date;
  end: Date;
  status: AppointmentStatus;

  assignedTo: ID;
  notes?: string;
}

/** Appointment as returned by API JSON (dates are ISO strings). */
export type AppointmentDto = WithIsoDates<Appointment>;

