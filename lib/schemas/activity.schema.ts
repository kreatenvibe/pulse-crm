import { z } from "zod";
import { ActivityTypeSchema, EntityTypeSchema } from "./enums";
import { requiredDate, requiredText } from "./fields";

const activityBase = z.object({
  entityType: EntityTypeSchema,
  entityId: requiredText("entityId"),
  type: ActivityTypeSchema,
  description: requiredText("description"),
  // Existence of the user is verified in the service (DB-backed).
  performedBy: requiredText("performedBy"),
  timestamp: requiredDate(),
});

export const CreateActivitySchema = activityBase;
export const UpdateActivitySchema = activityBase.partial();

export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;
export type UpdateActivityInput = z.infer<typeof UpdateActivitySchema>;
