import { z } from "zod";
import { EntityTypeSchema } from "./enums";
import { requiredText } from "./fields";

const noteBase = z.object({
  entityType: EntityTypeSchema,
  entityId: requiredText("entityId"),
  content: requiredText("content"),
  // Existence of the user is verified in the service (DB-backed).
  createdBy: requiredText("createdBy"),
});

export const CreateNoteSchema = noteBase;
export const UpdateNoteSchema = noteBase.partial();

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
