import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { invoices as InvoiceRow } from "@/lib/generated/prisma/client";
import type { ID } from "@/types/common";
import type { Invoice, InvoiceStatus } from "@/types/invoice";
import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
} from "@/lib/schemas/invoice.schema";
import { nextId, now } from "./helpers";
import { parseInput } from "./parse";
import { assertCustomerId, assertOptionalServiceId } from "./validation";

export type { CreateInvoiceInput, UpdateInvoiceInput };

/** Stable order: zero-padded ids sort identically to the original /data array. */
const ORDER_BY_ID = { id: "asc" } as const;

/** Map a Prisma `invoices` row (snake_case, nullable) to the domain `Invoice`. */
function toInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    customerId: row.customer_id,
    serviceId: row.service_id ?? undefined,
    // DB stores amount_cents as BigInt; the domain models it as a JS number.
    amountCents: Number(row.amount_cents),
    currency: row.currency,
    invoiceNumber: row.invoice_number,
    status: row.status as InvoiceStatus,
    issuedAt: row.issued_at,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Translate a validated partial update into a Prisma column patch. */
function toUpdatePatch(
  validated: UpdateInvoiceInput,
): Prisma.invoicesUncheckedUpdateInput {
  const patch: Prisma.invoicesUncheckedUpdateInput = { updated_at: now() };

  if ("customerId" in validated) patch.customer_id = validated.customerId;
  if ("serviceId" in validated) patch.service_id = validated.serviceId ?? null;
  if ("amountCents" in validated && validated.amountCents !== undefined) {
    patch.amount_cents = BigInt(validated.amountCents);
  }
  if ("currency" in validated) patch.currency = validated.currency;
  if ("invoiceNumber" in validated) {
    patch.invoice_number = validated.invoiceNumber;
  }
  if ("status" in validated) patch.status = validated.status;
  if ("issuedAt" in validated) patch.issued_at = validated.issuedAt;
  if ("dueDate" in validated) patch.due_date = validated.dueDate;

  return patch;
}

class InvoiceService {
  async getAll(): Promise<Invoice[]> {
    const rows = await prisma.invoices.findMany({ orderBy: ORDER_BY_ID });
    return rows.map(toInvoice);
  }

  async getById(id: ID): Promise<Invoice | null> {
    const row = await prisma.invoices.findUnique({ where: { id } });
    return row ? toInvoice(row) : null;
  }

  async create(data: CreateInvoiceInput): Promise<Invoice> {
    const input = parseInput(CreateInvoiceSchema, data);
    const customerId = await assertCustomerId(input.customerId);
    const serviceId = await assertOptionalServiceId(input.serviceId);
    const timestamp = now();

    const existing = await prisma.invoices.findMany({ select: { id: true } });
    const id = nextId("inv", existing);

    const row = await prisma.invoices.create({
      data: {
        id,
        customer_id: customerId,
        service_id: serviceId ?? null,
        amount_cents: BigInt(input.amountCents),
        currency: input.currency,
        invoice_number: input.invoiceNumber,
        status: input.status,
        issued_at: input.issuedAt,
        due_date: input.dueDate,
        created_at: timestamp,
        updated_at: timestamp,
      },
    });

    return toInvoice(row);
  }

  async update(id: ID, data: UpdateInvoiceInput): Promise<Invoice | null> {
    const previous = await this.getById(id);
    if (!previous) return null;

    const validated = parseInput(UpdateInvoiceSchema, data);
    if (validated.customerId !== undefined) {
      validated.customerId = await assertCustomerId(validated.customerId);
    }
    // serviceId is nullable: presence (even undefined) means "set/clear it".
    if ("serviceId" in validated) {
      validated.serviceId = await assertOptionalServiceId(validated.serviceId);
    }
    const row = await prisma.invoices.update({
      where: { id },
      data: toUpdatePatch(validated),
    });

    return toInvoice(row);
  }

  async delete(id: ID): Promise<boolean> {
    const existing = await prisma.invoices.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return false;

    await prisma.invoices.delete({ where: { id } });
    return true;
  }

  async getByCustomerId(customerId: ID): Promise<Invoice[]> {
    const rows = await prisma.invoices.findMany({
      where: { customer_id: customerId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toInvoice);
  }

  async getByStatus(status: InvoiceStatus): Promise<Invoice[]> {
    const rows = await prisma.invoices.findMany({
      where: { status },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toInvoice);
  }

  async getByServiceId(serviceId: ID): Promise<Invoice[]> {
    const rows = await prisma.invoices.findMany({
      where: { service_id: serviceId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toInvoice);
  }

  async getUnpaid(): Promise<Invoice[]> {
    const rows = await prisma.invoices.findMany({
      where: { status: { in: ["sent", "overdue"] } },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toInvoice);
  }

  async getOverdue(asOf: Date = now()): Promise<Invoice[]> {
    const rows = await prisma.invoices.findMany({
      where: {
        OR: [
          { status: "overdue" },
          { AND: [{ status: "sent" }, { due_date: { lt: asOf } }] },
        ],
      },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toInvoice);
  }
}

export const invoiceService = new InvoiceService();
