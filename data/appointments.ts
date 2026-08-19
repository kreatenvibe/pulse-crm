import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { customers } from "./customers";
import { leads } from "./leads";
import { d, pad } from "./helpers";

// Scoped so the org-001 generative blocks below can never wrap around into
// the org-002 fixtures appended to the shared `customers` array.
const org1Customers = customers.filter((c) => c.organizationId === "org-001");

const STATUSES: AppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

const TITLES_LEAD = [
  "Discovery call",
  "Product demo",
  "Pricing discussion",
  "Site visit",
  "Follow-up meeting",
  "Requirements workshop",
] as const;

const TITLES_CUST = [
  "Onboarding kickoff",
  "Quarterly review",
  "Support checkup",
  "Upsell consultation",
  "Training session",
  "Renewal discussion",
] as const;

/** 15 lead-parent + 15 customer-parent appointments (org-001). */
const org1Appointments: Appointment[] = [
  ...Array.from({ length: 15 }, (_, i) => {
    const index = i + 1;
    // Prefer open pipeline leads (21–50), cycle through them
    const lead = leads[20 + (i % 30)];
    const day = 1 + ((i * 2) % 27);
    const month = 5 + (i % 4);
    const hour = 10 + (i % 6);
    const start = d(
      `2026-${pad(month, 2)}-${pad(day, 2)}T${pad(hour, 2)}:00:00+05:30`,
    );
    const end = d(
      `2026-${pad(month, 2)}-${pad(day, 2)}T${pad(hour + 1, 2)}:00:00+05:30`,
    );
    const status = STATUSES[i % STATUSES.length];

    return {
      id: `appt-${pad(index)}`,
      leadId: lead.id,
      title: TITLES_LEAD[i % TITLES_LEAD.length],
      start,
      end,
      status,
      assignedTo: lead.assignedTo,
      notes:
        i % 3 === 0
          ? "Confirm WhatsApp reminder a day before."
          : i % 3 === 1
            ? "Bring pricing sheet for 5-seat plan."
            : undefined,
      organizationId: "org-001" as const,
      createdAt: d(
        `2026-${pad(month, 2)}-${pad(Math.max(1, day - 3), 2)}T09:00:00+05:30`,
      ),
      updatedAt: start,
    };
  }),
  ...Array.from({ length: 15 }, (_, i) => {
    const index = i + 16;
    const customer = org1Customers[i % org1Customers.length];
    const day = 2 + ((i * 3) % 26);
    const month = 4 + (i % 5);
    const hour = 11 + (i % 5);
    const start = d(
      `2026-${pad(month, 2)}-${pad(day, 2)}T${pad(hour, 2)}:30:00+05:30`,
    );
    const end = d(
      `2026-${pad(month, 2)}-${pad(day, 2)}T${pad(hour + 1, 2)}:30:00+05:30`,
    );

    return {
      id: `appt-${pad(index)}`,
      customerId: customer.id,
      title: TITLES_CUST[i % TITLES_CUST.length],
      start,
      end,
      status: STATUSES[(i + 2) % STATUSES.length],
      assignedTo: customer.assignedTo,
      notes: i % 4 === 0 ? "Zoom link shared via email." : undefined,
      organizationId: "org-001" as const,
      createdAt: d(
        `2026-${pad(month, 2)}-${pad(Math.max(1, day - 2), 2)}T12:00:00+05:30`,
      ),
      updatedAt: start,
    };
  }),
];

// --- org-002 fixtures ("Acme Field Services") — small, hand-authored, isolation-testing only. ---
const org2Appointments: Appointment[] = [
  {
    id: "appt-101",
    leadId: "lead-105",
    title: "Discovery call",
    start: d("2025-09-22T11:00:00+05:30"),
    end: d("2025-09-22T11:45:00+05:30"),
    status: "confirmed",
    assignedTo: "user-101",
    notes: "Bring pricing sheet for dental clinics.",
    organizationId: "org-002",
    createdAt: d("2025-09-18T18:05:00+05:30"),
    updatedAt: d("2025-09-18T18:05:00+05:30"),
  },
  {
    id: "appt-102",
    customerId: "cust-101",
    title: "Onboarding kickoff",
    start: d("2025-09-15T10:00:00+05:30"),
    end: d("2025-09-15T11:00:00+05:30"),
    status: "completed",
    assignedTo: "user-102",
    organizationId: "org-002",
    createdAt: d("2025-09-11T09:00:00+05:30"),
    updatedAt: d("2025-09-15T11:00:00+05:30"),
  },
];

export const appointments: Appointment[] = [...org1Appointments, ...org2Appointments];
