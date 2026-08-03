import { invoices } from "@/data/invoices";
import type { ID } from "@/types/common";
import type { Invoice, InvoiceStatus } from "@/types/invoice";
import { nextId, now } from "./helpers";

export type CreateInvoiceInput = Omit<
  Invoice,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateInvoiceInput = Partial<CreateInvoiceInput>;

class InvoiceService {
  async getAll(): Promise<Invoice[]> {
    return [...invoices];
  }

  async getById(id: ID): Promise<Invoice | null> {
    return invoices.find((invoice) => invoice.id === id) ?? null;
  }

  async create(data: CreateInvoiceInput): Promise<Invoice> {
    const timestamp = now();
    const invoice: Invoice = {
      ...data,
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

    const updated: Invoice = {
      ...invoices[index],
      ...data,
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
