import { z } from "zod";
import { AppointmentStatusSchema } from "./enums";
import { optionalText, requiredDate, requiredText } from "./fields";

const appointmentBase = z.object({
  // Exactly-one-of + existence for leadId/customerId is enforced in the service.
  leadId: optionalText(),
  customerId: optionalText(),
  title: requiredText("title"),
  start: requiredDate(),
  end: requiredDate(),
  status: AppointmentStatusSchema,
  // Existence of the user is verified in the service (DB-backed).
  assignedTo: requiredText("assignedTo"),
  notes: optionalText(),
});

// On create both dates are present, so the pure end >= start rule lives here.
// On update the comparison may involve the existing record, so it stays in the
// service.
export const CreateAppointmentSchema = appointmentBase.superRefine((value, ctx) => {
  if (value.end < value.start) {
    ctx.addIssue({
      code: "custom",
      message: "end must be on or after start",
      path: ["end"],
    });
  }
});

export const UpdateAppointmentSchema = appointmentBase.partial();

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;
