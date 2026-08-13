import type { StatusBadgeTone } from "@/components/ui";
import type { AppointmentStatus } from "@/types/appointment";
import type { CustomerLifecycleStatus } from "@/types/customer";
import type { InvoiceStatus } from "@/types/invoice";
import type { LeadPriority, LeadStatus } from "@/types/lead";
import type { ServiceStatus } from "@/types/service";
import type { TaskPriority, TaskStatus } from "@/types/task";

// Domain-specific status/priority → StatusBadge tone mappings.
// Keep these keyed by their own domain type so each stays type-safe and
// independently editable; do not collapse into one generic map.

export const APPOINTMENT_STATUS_TONE: Record<AppointmentStatus, StatusBadgeTone> = {
  scheduled: "info",
  confirmed: "success",
  completed: "neutral",
  cancelled: "danger",
  no_show: "warning",
};

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, StatusBadgeTone> = {
  draft: "neutral",
  sent: "info",
  paid: "success",
  overdue: "danger",
  cancelled: "neutral",
};

export const CUSTOMER_LIFECYCLE_TONE: Record<CustomerLifecycleStatus, StatusBadgeTone> = {
  onboarding: "info",
  active: "success",
  inactive: "neutral",
  churned: "danger",
};

export const LEAD_STATUS_TONE: Record<LeadStatus, StatusBadgeTone> = {
  new: "pipeline-new",
  contacted: "pipeline-contacted",
  qualified: "pipeline-qualified",
  appointment_scheduled: "pipeline-appointment",
  converted: "pipeline-converted",
  lost: "pipeline-lost",
};

export const LEAD_PRIORITY_TONE: Record<LeadPriority, StatusBadgeTone> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

export const TASK_STATUS_TONE: Record<TaskStatus, StatusBadgeTone> = {
  todo: "info",
  in_progress: "brand",
  done: "success",
  cancelled: "neutral",
};

export const TASK_PRIORITY_TONE: Record<TaskPriority, StatusBadgeTone> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

export const SERVICE_STATUS_TONE: Record<ServiceStatus, StatusBadgeTone> = {
  planned: "info",
  in_progress: "brand",
  completed: "success",
  cancelled: "neutral",
};
