import type { Note } from "@/types/note";
import type { EntityType } from "@/types/common";
import { appointments } from "./appointments";
import { customers } from "./customers";
import { invoices } from "./invoices";
import { leads } from "./leads";
import { services } from "./services";
import { tasks } from "./tasks";
import { d, pad } from "./helpers";

const CONTENTS = [
  "Prefers Hindi on calls; English OK for email.",
  "Best time to reach: 6–8pm IST on weekdays.",
  "Decision maker is the owner; manager handles day-to-day.",
  "Competing with a local spreadsheet + WhatsApp setup.",
  "Budget tentatively ₹15k–25k/year.",
  "Asked about GST invoices and e-way bill — clarify scope.",
  "Walk-in from Bangalore expo booth #12.",
  "Referred by existing customer Metro Auto Care.",
  "Clinic has 3 chairs; wants SMS reminders for patients.",
  "Cafe chain — 2 outlets now, 1 more planned in Q4.",
  "Sensitive about data — asked where servers are hosted.",
  "Needs Tamil UI labels for front-desk staff later.",
  "Accounts email differs from primary contact.",
  "Parking available only after 7pm near their office.",
  "Wants offline mode for field sales — mark as future ask.",
  "Invoice should go to accounts@ their domain.",
  "No-show last week — reschedule with reminder.",
  "Training completed for 4 staff members.",
  "Upsell opportunity: extra WhatsApp seats.",
  "Churn risk — competitor demo booked next Friday.",
] as const;

type Target = { entityType: EntityType; entityId: string; createdBy: string };

// Scoped to org-001 so this pool (and the 60 generated notes below) stays
// exactly as it was before org-002 existed. org-002 gets a small,
// hand-authored set of notes appended below instead of flowing through
// this generative pool.
function noteTargets(): Target[] {
  const list: Target[] = [];
  const org1Leads = leads.filter((l) => l.organizationId === "org-001");
  const org1Customers = customers.filter((c) => c.organizationId === "org-001");
  const org1Appointments = appointments.filter((a) => a.organizationId === "org-001");
  const org1Tasks = tasks.filter((t) => t.organizationId === "org-001");
  const org1Services = services.filter((s) => s.organizationId === "org-001");
  const org1Invoices = invoices.filter((inv) => inv.organizationId === "org-001");

  // Focus notes on leads & customers; sprinkle on related records
  for (const lead of org1Leads) {
    list.push({
      entityType: "lead",
      entityId: lead.id,
      createdBy: lead.assignedTo,
    });
  }
  for (const customer of org1Customers) {
    list.push({
      entityType: "customer",
      entityId: customer.id,
      createdBy: customer.assignedTo,
    });
  }
  for (let i = 0; i < 10; i++) {
    const appt = org1Appointments[i];
    list.push({
      entityType: "appointment",
      entityId: appt.id,
      createdBy: appt.assignedTo,
    });
  }
  for (let i = 0; i < 10; i++) {
    const task = org1Tasks[i];
    list.push({
      entityType: "task",
      entityId: task.id,
      createdBy: task.assignedTo,
    });
  }
  for (let i = 0; i < 5; i++) {
    const service = org1Services[i];
    list.push({
      entityType: "service",
      entityId: service.id,
      createdBy: org1Customers.find((c) => c.id === service.customerId)!.assignedTo,
    });
  }
  for (let i = 0; i < 5; i++) {
    const invoice = org1Invoices[i];
    list.push({
      entityType: "invoice",
      entityId: invoice.id,
      createdBy: org1Customers.find((c) => c.id === invoice.customerId)!.assignedTo,
    });
  }

  return list;
}

const TARGETS = noteTargets();

const org1Notes: Note[] = Array.from({ length: 60 }, (_, i) => {
  const index = i + 1;
  const target = TARGETS[i % TARGETS.length];
  const month = 2 + (i % 6);
  const day = 1 + ((i * 2) % 27);
  const createdAt = d(
    `2026-${pad(month, 2)}-${pad(day, 2)}T${pad(10 + (i % 7), 2)}:${pad((i * 5) % 60, 2)}:00+05:30`,
  );

  return {
    id: `note-${pad(index)}`,
    entityType: target.entityType,
    entityId: target.entityId,
    content: CONTENTS[i % CONTENTS.length],
    createdBy: target.createdBy,
    organizationId: "org-001" as const,
    createdAt,
    updatedAt: createdAt,
  };
});

// --- org-002 fixtures ("Acme Field Services") — small, hand-authored, isolation-testing only. ---
const org2Notes: Note[] = [
  {
    id: "note-101",
    entityType: "lead",
    entityId: "lead-101",
    content: "Referred by an existing Acme client — prioritize.",
    createdBy: "user-102",
    organizationId: "org-002",
    createdAt: d("2025-09-05T10:05:00+05:30"),
    updatedAt: d("2025-09-05T10:05:00+05:30"),
  },
  {
    id: "note-102",
    entityType: "customer",
    entityId: "cust-101",
    content: "Prefers WhatsApp over email for scheduling.",
    createdBy: "user-102",
    organizationId: "org-002",
    createdAt: d("2025-09-10T16:00:00+05:30"),
    updatedAt: d("2025-09-10T16:00:00+05:30"),
  },
];

export const notes: Note[] = [...org1Notes, ...org2Notes];
