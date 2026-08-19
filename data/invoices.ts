import type { Invoice, InvoiceStatus } from "@/types/invoice";
import { customers } from "./customers";
import { services } from "./services";
import { d, pad } from "./helpers";

// Scoped so the org-001 generative block below can never wrap around into
// the org-002 fixtures appended to the shared `customers`/`services` arrays.
const org1Customers = customers.filter((c) => c.organizationId === "org-001");
const org1Services = services.filter((s) => s.organizationId === "org-001");

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

const org1Invoices: Invoice[] = Array.from({ length: 15 }, (_, i) => {
  const index = i + 1;
  const customer = org1Customers[i % org1Customers.length];
  // Link most invoices to a service for the same customer when possible
  const matchingService =
    org1Services.find((s) => s.customerId === customer.id) ?? org1Services[i];
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
    organizationId: "org-001" as const,
    issuedAt,
    dueDate,
    createdAt: issuedAt,
    updatedAt: d(
      `2026-${pad(Math.min(8, month + 1), 2)}-${pad(1 + (i % 15), 2)}T12:00:00+05:30`,
    ),
  };
});

// --- org-002 fixtures ("Acme Field Services") — small, hand-authored, isolation-testing only. ---
// Deliberately reuses invoice number "INV-2026-001" (already used by org-001's
// inv-001) to prove the per-organization uniqueness constraint from Milestone 1
// (`@@unique([organization_id, invoice_number])`) accepts it once services
// actually write organization_id (global uniqueness would have rejected this).
const org2Invoices: Invoice[] = [
  {
    id: "inv-101",
    customerId: "cust-101",
    serviceId: "svc-101",
    amountCents: 2499000,
    currency: "INR",
    invoiceNumber: "INV-2026-001",
    status: "sent",
    organizationId: "org-002",
    issuedAt: d("2025-09-16T10:00:00+05:30"),
    dueDate: d("2025-09-30T23:59:00+05:30"),
    createdAt: d("2025-09-16T10:00:00+05:30"),
    updatedAt: d("2025-09-16T10:00:00+05:30"),
  },
];

export const invoices: Invoice[] = [...org1Invoices, ...org2Invoices];
