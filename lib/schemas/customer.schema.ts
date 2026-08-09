import { z } from "zod";
import { CustomerLifecycleStatusSchema } from "./enums";
import { optionalText, requiredText } from "./fields";

const customerBase = z.object({
  // Existence of the source lead is verified in the service (DB-backed).
  leadId: requiredText("leadId"),
  businessName: optionalText(),
  primaryContact: requiredText("primaryContact"),
  phone: requiredText("phone"),
  email: optionalText(),
  address: optionalText(),
  // Existence of the user is verified in the service (DB-backed).
  assignedTo: requiredText("assignedTo"),
  lifecycleStatus: CustomerLifecycleStatusSchema,
});

export const CreateCustomerSchema = customerBase;
export const UpdateCustomerSchema = customerBase.partial();

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
