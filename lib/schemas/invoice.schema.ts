import { z } from "zod";
import { InvoiceStatusSchema } from "./enums";
import {
  nonNegativeNumber,
  optionalText,
  requiredDate,
  requiredText,
} from "./fields";

const invoiceBase = z.object({
  // Existence of the customer is verified in the service (DB-backed).
  customerId: requiredText("customerId"),
  // Optional; existence (when present) is verified in the service (DB-backed).
  serviceId: optionalText(),
  amountCents: nonNegativeNumber("amountCents"),
  currency: requiredText("currency"),
  invoiceNumber: requiredText("invoiceNumber"),
  status: InvoiceStatusSchema,
  issuedAt: requiredDate(),
  dueDate: requiredDate(),
});

export const CreateInvoiceSchema = invoiceBase;
export const UpdateInvoiceSchema = invoiceBase.partial();

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;
