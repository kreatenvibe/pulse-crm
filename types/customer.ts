import { BaseEntity, ID, type WithIsoDates } from "./common";

export type CustomerLifecycleStatus =
  | "onboarding"
  | "active"
  | "inactive"
  | "churned";

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
}

/** Customer as returned by `/api/customers` (dates are ISO strings). */
export type CustomerDto = WithIsoDates<Customer>;

