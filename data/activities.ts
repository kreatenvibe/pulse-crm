import type { Activity, ActivityType } from "@/types/activity";
import type { EntityType } from "@/types/common";
import { appointments } from "./appointments";
import { customers } from "./customers";
import { invoices } from "./invoices";
import { leads } from "./leads";
import { services } from "./services";
import { tasks } from "./tasks";
import { d, pad } from "./helpers";

const TYPES: ActivityType[] = [
  "created",
  "call",
  "email",
  "whatsapp",
  "meeting",
  "status_change",
  "updated",
  "assigned",
];

const DESCRIPTIONS: Record<ActivityType, string[]> = {
  created: [
    "Record created in Pulse CRM.",
    "Imported from website form.",
    "Added manually by sales.",
  ],
  call: [
    "Outbound call — interested, requested demo.",
    "Missed call; left voicemail.",
    "Discussed pricing and GST invoice options.",
    "Confirmed decision timeline for next week.",
  ],
  email: [
    "Sent product overview and pricing PDF.",
    "Shared onboarding checklist.",
    "Follow-up email with case study (hospitality).",
    "Invoice copy emailed to accounts.",
  ],
  whatsapp: [
    "WhatsApp reply — preferred evening slots.",
    "Shared booking link on WhatsApp.",
    "Reminder for tomorrow's appointment.",
    "Customer confirmed address over WhatsApp.",
  ],
  meeting: [
    "Completed discovery meeting (45 min).",
    "Onsite visit at client office.",
    "Zoom demo with owner and manager.",
    "Quarterly business review completed.",
  ],
  status_change: [
    "Status moved to contacted.",
    "Status moved to qualified.",
    "Marked as converted after signed proposal.",
    "Lifecycle updated to active.",
  ],
  updated: [
    "Updated phone number and preferred language.",
    "Corrected company name and address.",
    "Changed assignee after territory reshuffle.",
    "Updated priority to high.",
  ],
  assigned: [
    "Assigned to Ananya Reddy.",
    "Reassigned to Vikram Patel.",
    "Ownership moved to Arjun Mehta.",
    "Assigned to Sneha Iyer (handoff).",
  ],
};

type Target = { entityType: EntityType; entityId: string; performedBy: string };

// Scoped to org-001 so this pool (and the 100 generated activities below)
// stays exactly as it was before org-002 existed. org-002 gets a small,
// hand-authored set of activities appended below instead of flowing through
// this generative pool.
function targets(): Target[] {
  const list: Target[] = [];
  const org1Leads = leads.filter((l) => l.organizationId === "org-001");
  const org1Customers = customers.filter((c) => c.organizationId === "org-001");
  const org1Appointments = appointments.filter((a) => a.organizationId === "org-001");
  const org1Tasks = tasks.filter((t) => t.organizationId === "org-001");
  const org1Services = services.filter((s) => s.organizationId === "org-001");
  const org1Invoices = invoices.filter((inv) => inv.organizationId === "org-001");

  for (const lead of org1Leads) {
    list.push({
      entityType: "lead",
      entityId: lead.id,
      performedBy: lead.assignedTo,
    });
  }
  for (const customer of org1Customers) {
    list.push({
      entityType: "customer",
      entityId: customer.id,
      performedBy: customer.assignedTo,
    });
  }
  for (const appt of org1Appointments) {
    list.push({
      entityType: "appointment",
      entityId: appt.id,
      performedBy: appt.assignedTo,
    });
  }
  for (const task of org1Tasks) {
    list.push({
      entityType: "task",
      entityId: task.id,
      performedBy: task.assignedTo,
    });
  }
  for (const service of org1Services) {
    list.push({
      entityType: "service",
      entityId: service.id,
      performedBy: org1Customers.find((c) => c.id === service.customerId)!
        .assignedTo,
    });
  }
  for (const invoice of org1Invoices) {
    list.push({
      entityType: "invoice",
      entityId: invoice.id,
      performedBy: org1Customers.find((c) => c.id === invoice.customerId)!
        .assignedTo,
    });
  }

  return list;
}

const TARGETS = targets();

const org1Activities: Activity[] = Array.from({ length: 100 }, (_, i) => {
  const index = i + 1;
  const target = TARGETS[i % TARGETS.length];
  const type = TYPES[i % TYPES.length];
  const descriptions = DESCRIPTIONS[type];
  const description = descriptions[i % descriptions.length];
  const month = 1 + (i % 7);
  const day = 1 + ((i * 3) % 27);
  const hour = 9 + (i % 9);
  const timestamp = d(
    `2026-${pad(month, 2)}-${pad(day, 2)}T${pad(hour, 2)}:${pad((i * 7) % 60, 2)}:00+05:30`,
  );

  return {
    id: `act-${pad(index)}`,
    entityType: target.entityType,
    entityId: target.entityId,
    type,
    description,
    performedBy: target.performedBy,
    organizationId: "org-001" as const,
    timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
});

// --- org-002 fixtures ("Acme Field Services") — small, hand-authored, isolation-testing only. ---
const org2Activities: Activity[] = [
  {
    id: "act-101",
    entityType: "lead",
    entityId: "lead-101",
    type: "created",
    description: "Record created in Pulse CRM.",
    performedBy: "user-102",
    organizationId: "org-002",
    timestamp: d("2025-09-05T10:00:00+05:30"),
    createdAt: d("2025-09-05T10:00:00+05:30"),
    updatedAt: d("2025-09-05T10:00:00+05:30"),
  },
  {
    id: "act-102",
    entityType: "lead",
    entityId: "lead-101",
    type: "status_change",
    description: "Marked as converted after signed proposal.",
    performedBy: "user-102",
    organizationId: "org-002",
    timestamp: d("2025-09-10T15:00:00+05:30"),
    createdAt: d("2025-09-10T15:00:00+05:30"),
    updatedAt: d("2025-09-10T15:00:00+05:30"),
  },
  {
    id: "act-103",
    entityType: "customer",
    entityId: "cust-101",
    type: "created",
    description: "Record created in Pulse CRM.",
    performedBy: "user-102",
    organizationId: "org-002",
    timestamp: d("2025-09-10T15:30:00+05:30"),
    createdAt: d("2025-09-10T15:30:00+05:30"),
    updatedAt: d("2025-09-10T15:30:00+05:30"),
  },
  {
    id: "act-104",
    entityType: "invoice",
    entityId: "inv-101",
    type: "created",
    description: "Invoice copy emailed to accounts.",
    performedBy: "user-102",
    organizationId: "org-002",
    timestamp: d("2025-09-16T10:15:00+05:30"),
    createdAt: d("2025-09-16T10:15:00+05:30"),
    updatedAt: d("2025-09-16T10:15:00+05:30"),
  },
];

export const activities: Activity[] = [...org1Activities, ...org2Activities];
