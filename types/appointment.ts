import { BaseEntity, ID, type WithIsoDates } from "./common";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Appointment extends BaseEntity {
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

