import { z } from "zod";
import {
  LeadPrioritySchema,
  LeadSourceSchema,
  LeadStatusSchema,
} from "./enums";
import {
  optionalDate,
  optionalText,
  requiredTags,
  requiredText,
} from "./fields";

/** Field-level rules shared by create and update. */
const leadBase = z.object({
  name: requiredText("name"),
  email: optionalText(),
  phone: requiredText("phone"),
  company: optionalText(),
  status: LeadStatusSchema,
  source: LeadSourceSchema,
  priority: LeadPrioritySchema,
  // Existence of the user is verified in the service (DB-backed).
  assignedTo: requiredText("assignedTo"),
  message: optionalText(),
  tags: requiredTags(),
  lastContactedAt: optionalDate(),
});

// tags default to [] on create (matches the old `data.tags ?? []`); the default
// is applied here only, never on the base, so it never leaks into update.partial().
export const CreateLeadSchema = leadBase.extend({
  tags: requiredTags().default([]),
});

export const UpdateLeadSchema = leadBase.partial();

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
