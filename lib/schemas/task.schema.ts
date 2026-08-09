import { z } from "zod";
import { TaskPrioritySchema, TaskStatusSchema } from "./enums";
import { optionalText, requiredDate, requiredText } from "./fields";

const taskBase = z.object({
  title: requiredText("title"),
  // Passthrough optional (the service historically stored description as-is,
  // e.g. an empty string stays an empty string); only reject non-strings.
  description: z.string().nullish(),
  // Existence of the user is verified in the service (DB-backed).
  assignedTo: requiredText("assignedTo"),
  // Exactly-one-of + existence for leadId/customerId is enforced in the service
  // (it is coupled to DB existence and, on update, to the existing record).
  leadId: optionalText(),
  customerId: optionalText(),
  dueDate: requiredDate(),
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
});

export const CreateTaskSchema = taskBase;
export const UpdateTaskSchema = taskBase.partial();

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
