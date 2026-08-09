import { z } from "zod";

/**
 * Centralized domain vocabularies — the single runtime source of truth.
 *
 * Each Zod enum defines the allowed values once; the matching `*_VALUES` array
 * (`Schema.options`) and the inferred type are derived from it. Services use the
 * schemas for input validation, aggregators/UI use the arrays for iteration, and
 * `types/*` re-export the inferred types so the whole app agrees on one list.
 *
 * This module imports only `zod`, so it is safe to import from client components
 * (future CRUD forms will reuse these).
 */

export const LeadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "appointment_scheduled",
  "converted",
  "lost",
]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;
export const LEAD_STATUSES = LeadStatusSchema.options;

export const LeadSourceSchema = z.enum([
  "website",
  "whatsapp",
  "facebook",
  "instagram",
  "google",
  "referral",
  "walk_in",
  "phone",
]);
export type LeadSource = z.infer<typeof LeadSourceSchema>;
export const LEAD_SOURCES = LeadSourceSchema.options;

export const LeadPrioritySchema = z.enum(["low", "medium", "high"]);
export type LeadPriority = z.infer<typeof LeadPrioritySchema>;
export const LEAD_PRIORITIES = LeadPrioritySchema.options;

export const CustomerLifecycleStatusSchema = z.enum([
  "onboarding",
  "active",
  "inactive",
  "churned",
]);
export type CustomerLifecycleStatus = z.infer<
  typeof CustomerLifecycleStatusSchema
>;
export const CUSTOMER_LIFECYCLE_STATUSES =
  CustomerLifecycleStatusSchema.options;

export const TaskPrioritySchema = z.enum(["low", "medium", "high"]);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export const TASK_PRIORITIES = TaskPrioritySchema.options;

export const TaskStatusSchema = z.enum([
  "todo",
  "in_progress",
  "done",
  "cancelled",
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export const TASK_STATUSES = TaskStatusSchema.options;

export const AppointmentStatusSchema = z.enum([
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;
export const APPOINTMENT_STATUSES = AppointmentStatusSchema.options;

export const ServiceStatusSchema = z.enum([
  "planned",
  "in_progress",
  "completed",
  "cancelled",
]);
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;
export const SERVICE_STATUSES = ServiceStatusSchema.options;

export const InvoiceStatusSchema = z.enum([
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;
export const INVOICE_STATUSES = InvoiceStatusSchema.options;

export const ActivityTypeSchema = z.enum([
  "call",
  "email",
  "whatsapp",
  "meeting",
  "status_change",
  "created",
  "updated",
  "assigned",
]);
export type ActivityType = z.infer<typeof ActivityTypeSchema>;
export const ACTIVITY_TYPES = ActivityTypeSchema.options;

export const EntityTypeSchema = z.enum([
  "lead",
  "customer",
  "appointment",
  "task",
  "service",
  "invoice",
  "note",
]);
export type EntityType = z.infer<typeof EntityTypeSchema>;
export const ENTITY_TYPES = EntityTypeSchema.options;

export const UserRoleSchema = z.enum(["admin", "manager", "sales"]);
export type UserRole = z.infer<typeof UserRoleSchema>;
export const USER_ROLES = UserRoleSchema.options;
