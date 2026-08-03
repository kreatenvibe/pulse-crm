import { BaseEntity, ID } from "./common";

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
