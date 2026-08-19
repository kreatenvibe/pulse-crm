import type { Service, ServiceStatus } from "@/types/service";
import { customers } from "./customers";
import { d, pad } from "./helpers";

// Scoped so the org-001 generative block below can never wrap around into
// the org-002 fixture appended to the shared `customers` array (it would:
// this loop runs longer than org1Customers.length, so `i % customers.length`
// against the unscoped array would eventually land on the org-002 row).
const org1Customers = customers.filter((c) => c.organizationId === "org-001");

const STATUSES: ServiceStatus[] = [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
];

const CATALOG = [
  [
    "CRM Setup & Onboarding",
    "Workspace setup, user invites, and pipeline configuration.",
  ],
  [
    "WhatsApp Business Integration",
    "Connect official WhatsApp number and message templates.",
  ],
  [
    "Appointment Booking Portal",
    "Public booking page synced to staff calendars.",
  ],
  [
    "Staff Training (2 sessions)",
    "Live training for sales and front-desk teams.",
  ],
  [
    "Data Migration",
    "Import leads and customers from Excel / Google Sheets.",
  ],
  [
    "Custom Reports Pack",
    "Weekly conversion and source attribution reports.",
  ],
  [
    "Invoice & GST Module",
    "Enable invoicing with GST fields and PDF export.",
  ],
  [
    "Follow-up Automation",
    "Reminders for overdue tasks and missed appointments.",
  ],
] as const;

const org1Services: Service[] = Array.from({ length: 25 }, (_, i) => {
  const index = i + 1;
  const customer = org1Customers[i % org1Customers.length];
  const [title, description] = CATALOG[i % CATALOG.length];
  const status = STATUSES[i % STATUSES.length];
  const month = 3 + (i % 6);
  const day = 1 + ((i * 2) % 27);
  const createdAt = d(
    `2026-${pad(month, 2)}-${pad(day, 2)}T09:${pad(i % 60, 2)}:00+05:30`,
  );

  return {
    id: `svc-${pad(index)}`,
    customerId: customer.id,
    title,
    description,
    status,
    organizationId: "org-001" as const,
    scheduledDate:
      status === "cancelled"
        ? undefined
        : d(`2026-${pad(month, 2)}-${pad(Math.min(28, day + 7), 2)}T11:00:00+05:30`),
    createdAt,
    updatedAt: d(
      `2026-${pad(Math.min(8, month + 1), 2)}-${pad(1 + (i % 20), 2)}T10:00:00+05:30`,
    ),
  };
});

// --- org-002 fixtures ("Acme Field Services") — small, hand-authored, isolation-testing only. ---
const org2Services: Service[] = [
  {
    id: "svc-101",
    customerId: "cust-101",
    title: "CRM Setup & Onboarding",
    description: "Workspace setup, user invites, and pipeline configuration.",
    status: "in_progress",
    organizationId: "org-002",
    scheduledDate: d("2025-09-20T11:00:00+05:30"),
    createdAt: d("2025-09-11T09:15:00+05:30"),
    updatedAt: d("2025-09-15T10:00:00+05:30"),
  },
];

export const services: Service[] = [...org1Services, ...org2Services];
