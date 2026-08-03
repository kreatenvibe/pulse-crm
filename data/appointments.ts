import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { customers } from "./customers";
import { leads } from "./leads";
import { d, pad } from "./helpers";

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

/** 15 lead-parent + 15 customer-parent appointments. */
export const appointments: Appointment[] = [
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
      createdAt: d(
        `2026-${pad(month, 2)}-${pad(Math.max(1, day - 3), 2)}T09:00:00+05:30`,
      ),
      updatedAt: start,
    };
  }),
  ...Array.from({ length: 15 }, (_, i) => {
    const index = i + 16;
    const customer = customers[i % customers.length];
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
      createdAt: d(
        `2026-${pad(month, 2)}-${pad(Math.max(1, day - 2), 2)}T12:00:00+05:30`,
      ),
      updatedAt: start,
    };
  }),
];
