import type { Service, ServiceStatus } from "@/types/service";
import { customers } from "./customers";
import { d, pad } from "./helpers";

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

export const services: Service[] = Array.from({ length: 25 }, (_, i) => {
  const index = i + 1;
  const customer = customers[i % customers.length];
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
