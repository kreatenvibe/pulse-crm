import { BaseEntity, ID, type WithIsoDates } from "./common";
import type { InvoiceStatus } from "@/lib/schemas/enums";

// Source of truth: lib/schemas/enums.ts.
export type { InvoiceStatus };

export interface Invoice extends BaseEntity {
  customerId: ID;
  serviceId?: ID;

  amountCents: number;
  currency: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issuedAt: Date;
  dueDate: Date;

  /** Optional until Milestone 5/6 thread org scoping through the service layer. */
  organizationId?: ID;
}

/** Invoice as returned by API (dates are ISO strings). */
export type InvoiceDto = WithIsoDates<Invoice>;
