import { z } from "zod";
import { ServiceStatusSchema } from "./enums";
import { optionalDate, optionalText, requiredText } from "./fields";

const serviceBase = z.object({
  // Existence of the customer is verified in the service (DB-backed).
  customerId: requiredText("customerId"),
  title: requiredText("title"),
  description: optionalText(),
  status: ServiceStatusSchema,
  scheduledDate: optionalDate(),
});

export const CreateServiceSchema = serviceBase;
export const UpdateServiceSchema = serviceBase.partial();

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;
