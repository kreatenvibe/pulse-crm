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

function targets(): Target[] {
  const list: Target[] = [];

  for (const lead of leads) {
    list.push({
      entityType: "lead",
      entityId: lead.id,
      performedBy: lead.assignedTo,
    });
  }
  for (const customer of customers) {
    list.push({
      entityType: "customer",
      entityId: customer.id,
      performedBy: customer.assignedTo,
    });
  }
  for (const appt of appointments) {
    list.push({
      entityType: "appointment",
      entityId: appt.id,
      performedBy: appt.assignedTo,
    });
  }
  for (const task of tasks) {
    list.push({
      entityType: "task",
      entityId: task.id,
      performedBy: task.assignedTo,
    });
  }
  for (const service of services) {
    list.push({
      entityType: "service",
      entityId: service.id,
      performedBy: customers.find((c) => c.id === service.customerId)!
        .assignedTo,
    });
  }
  for (const invoice of invoices) {
    list.push({
      entityType: "invoice",
      entityId: invoice.id,
      performedBy: customers.find((c) => c.id === invoice.customerId)!
        .assignedTo,
    });
  }

  return list;
}

const TARGETS = targets();

export const activities: Activity[] = Array.from({ length: 100 }, (_, i) => {
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
    timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
});
