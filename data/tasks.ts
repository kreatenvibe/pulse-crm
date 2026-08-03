import type { Task, TaskPriority, TaskStatus } from "@/types/task";
import { customers } from "./customers";
import { leads } from "./leads";
import { d, pad } from "./helpers";

const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];
const STATUSES: TaskStatus[] = ["todo", "in_progress", "done", "cancelled"];

const LEAD_TASKS = [
  ["Call back after demo", "Discussed interest in WhatsApp templates."],
  ["Send pricing PDF", "Include GST and annual discount."],
  ["Qualify budget", "Ask about monthly lead volume."],
  ["Schedule site visit", "Preferred evenings only."],
  ["Share case study", "Hospitality vertical — Coastal Freight style."],
  ["Update lead score", "Engaged on Instagram ads thrice."],
  ["Confirm decision maker", "May need owner on the next call."],
  ["Follow up WhatsApp", "No reply to last Tuesday message."],
  ["Add to nurture sequence", "Not ready until next quarter."],
  ["Book second demo", "Bring technical contact from their side."],
] as const;

const CUST_TASKS = [
  ["Complete onboarding checklist", "Users, pipeline stages, WhatsApp number."],
  ["Collect GSTIN", "Needed before first invoice."],
  ["Train front-desk staff", "30-minute Zoom session."],
  ["Review first-week usage", "Check appointment booking rate."],
  ["Upsell SMS pack", "They hit WhatsApp limits last month."],
  ["Fix duplicate contacts", "Import from old Excel had dupes."],
  ["Renewal reminder", "Contract ends in 45 days."],
  ["Share Q2 report", "Leads → customers conversion summary."],
  ["Enable invoice reminders", "Toggle in billing settings."],
  ["Health check call", "Inactive for 3 weeks."],
] as const;

/** 20 lead-parent + 20 customer-parent tasks. */
export const tasks: Task[] = [
  ...Array.from({ length: 20 }, (_, i) => {
    const index = i + 1;
    const lead = leads[i % 50];
    const [title, description] = LEAD_TASKS[i % LEAD_TASKS.length];
    const month = 5 + (i % 4);
    const day = 1 + ((i * 2) % 27);

    return {
      id: `task-${pad(index)}`,
      title,
      description,
      assignedTo: lead.assignedTo,
      leadId: lead.id,
      dueDate: d(`2026-${pad(month, 2)}-${pad(day, 2)}T18:00:00+05:30`),
      priority: PRIORITIES[i % PRIORITIES.length],
      status: STATUSES[i % STATUSES.length],
      createdAt: d(
        `2026-${pad(month, 2)}-${pad(Math.max(1, day - 5), 2)}T10:15:00+05:30`,
      ),
      updatedAt: d(
        `2026-${pad(month, 2)}-${pad(Math.max(1, day - 1), 2)}T16:00:00+05:30`,
      ),
    };
  }),
  ...Array.from({ length: 20 }, (_, i) => {
    const index = i + 21;
    const customer = customers[i % customers.length];
    const [title, description] = CUST_TASKS[i % CUST_TASKS.length];
    const month = 4 + (i % 5);
    const day = 3 + ((i * 3) % 25);

    return {
      id: `task-${pad(index)}`,
      title,
      description,
      assignedTo: customer.assignedTo,
      customerId: customer.id,
      dueDate: d(`2026-${pad(month, 2)}-${pad(day, 2)}T17:30:00+05:30`),
      priority: PRIORITIES[(i + 1) % PRIORITIES.length],
      status: STATUSES[(i + 2) % STATUSES.length],
      createdAt: d(
        `2026-${pad(month, 2)}-${pad(Math.max(1, day - 4), 2)}T11:00:00+05:30`,
      ),
      updatedAt: d(
        `2026-${pad(month, 2)}-${pad(Math.max(1, day - 1), 2)}T15:45:00+05:30`,
      ),
    };
  }),
];
