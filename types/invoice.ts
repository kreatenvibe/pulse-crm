import { BaseEntity, ID, type WithIsoDates } from "./common";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "cancelled";

export interface Invoice extends BaseEntity {
  customerId: ID;
  serviceId?: ID;

  amountCents: number;
  currency: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issuedAt: Date;
  dueDate: Date;
}

/** Invoice as returned by API (dates are ISO strings). */
export type InvoiceDto = WithIsoDates<Invoice>;
