import { invoices } from "@/data/invoices";
import type { ID } from "@/types/common";
import type { Invoice, InvoiceStatus } from "@/types/invoice";
import { nextId, now } from "./helpers";
import {
  assertCustomerId,
  assertEnum,
  assertOptionalServiceId,
  assertPositiveNumber,
  assertRequiredString,
  toDate,
} from "./validation";

export type CreateInvoiceInput = Omit<
  Invoice,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateInvoiceInput = Partial<CreateInvoiceInput>;

const INVOICE_STATUSES: InvoiceStatus[] = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
];

function validateCreateInput(data: CreateInvoiceInput): CreateInvoiceInput {
  return {
    customerId: assertCustomerId(data.customerId),
    serviceId: assertOptionalServiceId(data.serviceId),
    amountCents: assertPositiveNumber(data.amountCents, "amountCents"),
    currency: assertRequiredString(data.currency, "currency"),
    invoiceNumber: assertRequiredString(data.invoiceNumber, "invoiceNumber"),
    status: assertEnum(data.status, INVOICE_STATUSES, "status"),
    issuedAt: toDate(data.issuedAt, "issuedAt"),
    dueDate: toDate(data.dueDate, "dueDate"),
  };
}

function validateUpdateInput(data: UpdateInvoiceInput): UpdateInvoiceInput {
  const validated: UpdateInvoiceInput = {};

  if ("customerId" in data && data.customerId !== undefined) {
    validated.customerId = assertCustomerId(data.customerId);
  }
  if ("serviceId" in data) {
    validated.serviceId = assertOptionalServiceId(data.serviceId);
  }
  if ("amountCents" in data && data.amountCents !== undefined) {
    validated.amountCents = assertPositiveNumber(
      data.amountCents,
      "amountCents",
    );
  }
  if ("currency" in data && data.currency !== undefined) {
    validated.currency = assertRequiredString(data.currency, "currency");
  }
  if ("invoiceNumber" in data && data.invoiceNumber !== undefined) {
    validated.invoiceNumber = assertRequiredString(
      data.invoiceNumber,
      "invoiceNumber",
    );
  }
  if ("status" in data && data.status !== undefined) {
    validated.status = assertEnum(data.status, INVOICE_STATUSES, "status");
  }
  if ("issuedAt" in data && data.issuedAt !== undefined) {
    validated.issuedAt = toDate(data.issuedAt, "issuedAt");
  }
  if ("dueDate" in data && data.dueDate !== undefined) {
    validated.dueDate = toDate(data.dueDate, "dueDate");
  }

  return validated;
}

class InvoiceService {
  async getAll(): Promise<Invoice[]> {
    return [...invoices];
  }

  async getById(id: ID): Promise<Invoice | null> {
    return invoices.find((invoice) => invoice.id === id) ?? null;
  }

  async create(data: CreateInvoiceInput): Promise<Invoice> {
    const validated = validateCreateInput(data);
    const timestamp = now();
    const invoice: Invoice = {
      ...validated,
      id: nextId("inv", invoices),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    invoices.push(invoice);
    return invoice;
  }

  async update(id: ID, data: UpdateInvoiceInput): Promise<Invoice | null> {
    const index = invoices.findIndex((invoice) => invoice.id === id);
    if (index === -1) return null;

    const validated = validateUpdateInput(data);
    const updated: Invoice = {
      ...invoices[index],
      ...validated,
      id,
      updatedAt: now(),
    };
    invoices[index] = updated;
    return updated;
  }

  async delete(id: ID): Promise<boolean> {
    const index = invoices.findIndex((invoice) => invoice.id === id);
    if (index === -1) return false;
    invoices.splice(index, 1);
    return true;
  }

  async getByCustomerId(customerId: ID): Promise<Invoice[]> {
    return invoices.filter((invoice) => invoice.customerId === customerId);
  }

  async getByStatus(status: InvoiceStatus): Promise<Invoice[]> {
    return invoices.filter((invoice) => invoice.status === status);
  }

  async getByServiceId(serviceId: ID): Promise<Invoice[]> {
    return invoices.filter((invoice) => invoice.serviceId === serviceId);
  }

  async getUnpaid(): Promise<Invoice[]> {
    return invoices.filter(
      (invoice) =>
        invoice.status === "sent" || invoice.status === "overdue",
    );
  }

  async getOverdue(asOf: Date = now()): Promise<Invoice[]> {
    return invoices.filter(
      (invoice) =>
        invoice.status === "overdue" ||
        (invoice.status === "sent" && invoice.dueDate < asOf),
    );
  }
}

export const invoiceService = new InvoiceService();
