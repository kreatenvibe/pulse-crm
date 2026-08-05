import { BaseEntity, ID, type WithIsoDates } from "./common";

export type ServiceStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Service extends BaseEntity {
  customerId: ID;

  title: string;
  description?: string;
  status: ServiceStatus;
  scheduledDate?: Date;
}

/** Service as returned by API (dates are ISO strings). */
export type ServiceDto = WithIsoDates<Service>;
