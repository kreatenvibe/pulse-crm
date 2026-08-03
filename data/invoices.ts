import type { Invoice, InvoiceStatus } from "@/types/invoice";
import { customers } from "./customers";
import { services } from "./services";
import { d, pad } from "./helpers";

const STATUSES: InvoiceStatus[] = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
];

const AMOUNTS_CENTS = [
  1499000, // ₹14,990
  2499000,
  4999000,
  9999000,
  7999000,
  1999000,
  3499000,
  5999000,
  8999000,
  12999000,
  4499000,
  2999000,
  6999000,
  15999000,
  999000,
] as const;

export const invoices: Invoice[] = Array.from({ length: 15 }, (_, i) => {
  const index = i + 1;
  const customer = customers[i % customers.length];
  // Link most invoices to a service for the same customer when possible
  const matchingService =
    services.find((s) => s.customerId === customer.id) ?? services[i];
  const hasService = i % 5 !== 4;
  const month = 3 + (i % 5);
  const day = 5 + ((i * 2) % 20);
  const issuedAt = d(
    `2026-${pad(month, 2)}-${pad(day, 2)}T10:00:00+05:30`,
  );
  const dueDate = d(
    `2026-${pad(month, 2)}-${pad(Math.min(28, day + 14), 2)}T23:59:00+05:30`,
  );

  return {
    id: `inv-${pad(index)}`,
    customerId: customer.id,
    serviceId: hasService ? matchingService.id : undefined,
    amountCents: AMOUNTS_CENTS[i],
    currency: "INR",
    invoiceNumber: `INV-2026-${pad(index)}`,
    status: STATUSES[i % STATUSES.length],
    issuedAt,
    dueDate,
    createdAt: issuedAt,
    updatedAt: d(
      `2026-${pad(Math.min(8, month + 1), 2)}-${pad(1 + (i % 15), 2)}T12:00:00+05:30`,
    ),
  };
});
