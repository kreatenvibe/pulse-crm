import { BaseEntity, ID, type WithIsoDates } from "./common";
import type { CustomerLifecycleStatus } from "@/lib/schemas/enums";

// Source of truth: lib/schemas/enums.ts.
export type { CustomerLifecycleStatus };

export interface Customer extends BaseEntity {
  /** Source of truth for conversion: one Customer per Lead. */
  leadId: ID;

  businessName?: string;
  primaryContact: string;
  phone: string;
  email?: string;
  address?: string;

  assignedTo: ID;
  lifecycleStatus: CustomerLifecycleStatus;

  /** Optional until Milestone 5/6 thread org scoping through the service layer. */
  organizationId?: ID;
}

/** Customer as returned by `/api/customers` (dates are ISO strings). */
export type CustomerDto = WithIsoDates<Customer>;

