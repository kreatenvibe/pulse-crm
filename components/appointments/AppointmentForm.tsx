"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Button,
  FormCombobox,
  FormField,
  FormInput,
  FormSegmented,
  FormSelect,
  FormTextarea,
} from "@/components/ui";
import { useCustomers, useLeads, useUsers } from "@/hooks";
import { ApiError, api } from "@/lib/api";
import { formatLabel } from "@/lib/format";
import { APPOINTMENT_STATUSES, CreateAppointmentSchema } from "@/lib/schemas";
import type { AppointmentDto } from "@/types/appointment";

/**
 * Single Appointment form for both create and edit.
 *
 * Validation is driven entirely by the existing `CreateAppointmentSchema` (input
 * → output via `zodResolver`); the form never re-states field rules — including
 * the end >= start cross-field check, which lives in the schema. In edit mode the
 * same schema still applies — a full, valid appointment is PATCHed, which the
 * partial `UpdateAppointmentSchema` on the server accepts.
 *
 * The lead/customer link is exactly-one-of, enforced (with existence) in the
 * service; a local segmented control picks which relationship applies while the
 * two id inputs stay real schema fields.
 */

type AppointmentFormValues = z.input<typeof CreateAppointmentSchema>;
type AppointmentFormOutput = z.output<typeof CreateAppointmentSchema>;

type AppointmentFormMode = "create" | "edit";

type AppointmentFormProps = {
  mode: AppointmentFormMode;
  /** Existing appointment to populate the form in edit mode. Ignored on create. */
  appointment?: AppointmentDto;
  onSuccess?: (appointment: AppointmentDto) => void;
  onCancel?: () => void;
};

/** ISO string → the `YYYY-MM-DDTHH:mm` value an <input type="datetime-local"> expects. */
function toDateTimeInputValue(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Which relationship the appointment is linked to. Local UI state, not a schema field. */
type AppointmentLink = "lead" | "customer";

/** Detect the existing link so edit mode opens the correct selector. */
function initialLink(appointment?: AppointmentDto): AppointmentLink {
  return appointment?.customerId ? "customer" : "lead";
}

/** Build the schema-input defaults from an optional existing appointment. */
function buildDefaults(appointment?: AppointmentDto): AppointmentFormValues {
  return {
    title: appointment?.title ?? "",
    leadId: appointment?.leadId ?? "",
    customerId: appointment?.customerId ?? "",
    assignedTo: appointment?.assignedTo ?? "",
    start: toDateTimeInputValue(appointment?.start),
    end: toDateTimeInputValue(appointment?.end),
    status: appointment?.status ?? "scheduled",
    notes: appointment?.notes ?? "",
  };
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function AppointmentForm({
  mode,
  appointment,
  onSuccess,
  onCancel,
}: AppointmentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues, unknown, AppointmentFormOutput>({
    resolver: zodResolver(CreateAppointmentSchema),
    defaultValues: buildDefaults(appointment),
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  // Picker options from existing endpoints (no new fetching abstraction).
  const { data: users, loading: usersLoading } = useUsers();
  const { data: leads, loading: leadsLoading } = useLeads();
  const { data: customers, loading: customersLoading } = useCustomers();
  const userOptions = users.map((user) => ({
    value: user.id,
    label: user.name,
  }));
  const leadOptions = leads.map((lead) => ({
    value: lead.id,
    label: lead.company ? `${lead.name} — ${lead.company}` : lead.name,
  }));
  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: customer.businessName
      ? `${customer.businessName} — ${customer.primaryContact}`
      : customer.primaryContact,
  }));

  // The lead/customer link is exactly-one-of (enforced server-side). A local
  // segmented control picks which relationship applies; the two ids stay real
  // schema fields.
  const [linkType, setLinkType] = useState<AppointmentLink>(() =>
    initialLink(appointment),
  );

  // Re-populate when the edited appointment changes (e.g. navigating between them).
  useEffect(() => {
    reset(buildDefaults(appointment));
    setLinkType(initialLink(appointment));
    setSubmitError(null);
  }, [appointment, reset]);

  // Keep the non-selected relationship cleared so exactly one id is ever
  // submitted. useWatch (not watch()) drives this reactively, matching the
  // project's conditional-field pattern.
  const inactiveName = linkType === "lead" ? "customerId" : "leadId";
  const inactiveValue = useWatch({ control, name: inactiveName });
  useEffect(() => {
    if (inactiveValue) setValue(inactiveName, "");
  }, [inactiveName, inactiveValue, setValue]);

  const onSubmit: SubmitHandler<AppointmentFormOutput> = async (values) => {
    setSubmitError(null);
    try {
      const saved =
        mode === "edit" && appointment
          ? await api.patch<AppointmentDto>(
              `/api/appointments/${appointment.id}`,
              values,
            )
          : await api.post<AppointmentDto>("/api/appointments", values);
      onSuccess?.(saved);
    } catch (error) {
      setSubmitError(
        toErrorMessage(error, "Could not save appointment. Please try again."),
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <FormField label="Title" required error={errors.title?.message}>
          <FormInput {...register("title")} placeholder="Product demo" />
        </FormField>

        <FormCombobox
          control={control}
          name="assignedTo"
          label="Assigned to"
          required
          options={userOptions}
          isLoading={usersLoading}
          isClearable
          placeholder="Select a user"
          error={errors.assignedTo?.message}
        />

        <FormField label="Start" required error={errors.start?.message}>
          <FormInput type="datetime-local" {...register("start")} />
        </FormField>

        <FormField label="End" required error={errors.end?.message}>
          <FormInput type="datetime-local" {...register("end")} />
        </FormField>

        <FormField label="Status" error={errors.status?.message}>
          <FormSelect {...register("status")}>
            {APPOINTMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value)}
              </option>
            ))}
          </FormSelect>
        </FormField>

        <div className="sm:col-span-2">
          <FormSegmented
            label="Link appointment to"
            name="appointmentLink"
            value={linkType}
            onChange={setLinkType}
            options={[
              { value: "lead", label: "Lead" },
              { value: "customer", label: "Customer" },
            ]}
          />

          <div className="mt-2">
            {linkType === "lead" ? (
              <FormCombobox
                control={control}
                name="leadId"
                label="Lead"
                required
                options={leadOptions}
                isLoading={leadsLoading}
                isClearable
                placeholder="Select a lead"
                error={errors.leadId?.message}
              />
            ) : (
              <FormCombobox
                control={control}
                name="customerId"
                label="Customer"
                required
                options={customerOptions}
                isLoading={customersLoading}
                isClearable
                placeholder="Select a customer"
                error={errors.customerId?.message}
              />
            )}
          </div>
        </div>
      </div>

      <FormField label="Notes" error={errors.notes?.message}>
        <FormTextarea
          {...register("notes")}
          placeholder="Notes about this appointment…"
        />
      </FormField>

      {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Create appointment"}
        </Button>
        {onCancel ? (
          <Button type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
