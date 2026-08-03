import { BaseEntity, ID } from "./common";

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
