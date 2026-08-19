import { BaseEntity, ID, type WithIsoDates } from "./common";
import type { ServiceStatus } from "@/lib/schemas/enums";

// Source of truth: lib/schemas/enums.ts.
export type { ServiceStatus };

export interface Service extends BaseEntity {
  customerId: ID;

  title: string;
  description?: string;
  status: ServiceStatus;
  scheduledDate?: Date;

  /** Optional until Milestone 5/6 thread org scoping through the service layer. */
  organizationId?: ID;
}

/** Service as returned by API (dates are ISO strings). */
export type ServiceDto = WithIsoDates<Service>;
