"use client";

import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Button,
  FormCombobox,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/ui";
import { useCustomers } from "@/hooks";
import { api, toErrorMessage } from "@/lib/api";
import { applyServerFieldErrors } from "@/lib/form-errors";
import { formatCustomerName, formatLabel } from "@/lib/format";
import { CreateServiceSchema, SERVICE_STATUSES } from "@/lib/schemas";
import type { ServiceDto } from "@/types/service";

/**
 * Single Service form for both create and edit.
 *
 * Validation is driven entirely by the existing `CreateServiceSchema` (input →
 * output via `zodResolver`); the form never re-states field rules. In edit mode
 * the same schema still applies — a full, valid service is PATCHed, which the
 * partial `UpdateServiceSchema` on the server accepts.
 *
 * The customer link is a real schema field, populated through the shared
 * FormCombobox (id in, label shown) using the existing customers endpoint.
 */

type ServiceFormValues = z.input<typeof CreateServiceSchema>;
type ServiceFormOutput = z.output<typeof CreateServiceSchema>;

type ServiceFormMode = "create" | "edit";

type ServiceFormProps = {
  mode: ServiceFormMode;
  /** Existing service to populate the form in edit mode. Ignored on create. */
  service?: ServiceDto;
  onSuccess?: (service: ServiceDto) => void;
  onCancel?: () => void;
};

/** ISO string → the `YYYY-MM-DD` value a <input type="date"> expects. */
function toDateInputValue(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Build the schema-input defaults from an optional existing service. */
function buildDefaults(service?: ServiceDto): ServiceFormValues {
  return {
    customerId: service?.customerId ?? "",
    title: service?.title ?? "",
    description: service?.description ?? "",
    status: service?.status ?? "planned",
    scheduledDate: toDateInputValue(service?.scheduledDate),
  };
}

export function ServiceForm({
  mode,
  service,
  onSuccess,
  onCancel,
}: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues, unknown, ServiceFormOutput>({
    resolver: zodResolver(CreateServiceSchema),
    defaultValues: buildDefaults(service),
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  // Customer picker options from the existing endpoint (no new fetching
  // abstraction). Same id → label mapping as the other forms.
  const { data: customers, loading: customersLoading } = useCustomers();
  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: formatCustomerName(customer),
  }));

  // Re-populate when the edited service changes (e.g. navigating between them).
  useEffect(() => {
    reset(buildDefaults(service));
    setSubmitError(null);
  }, [service, reset]);

  const onSubmit: SubmitHandler<ServiceFormOutput> = async (values) => {
    setSubmitError(null);
    try {
      const saved =
        mode === "edit" && service
          ? await api.patch<ServiceDto>(`/api/services/${service.id}`, values)
          : await api.post<ServiceDto>("/api/services", values);
      onSuccess?.(saved);
    } catch (error) {
      applyServerFieldErrors(error, setError);
      setSubmitError(
        toErrorMessage(error, "Could not save service. Please try again."),
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <FormField label="Title" required error={errors.title?.message}>
          <FormInput {...register("title")} placeholder="Onboarding project" />
        </FormField>

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

        <FormField label="Status" error={errors.status?.message}>
          <FormSelect {...register("status")}>
            {SERVICE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value)}
              </option>
            ))}
          </FormSelect>
        </FormField>

        <FormField
          label="Scheduled date"
          error={errors.scheduledDate?.message}
        >
          <FormInput
            type="date"
            {...register("scheduledDate", {
              // "" is not a date; collapse it to undefined so the optional
              // schema treats a blank field as "not set".
              setValueAs: (value) => (value === "" ? undefined : value),
            })}
          />
        </FormField>
      </div>

      <FormField label="Description" error={errors.description?.message}>
        <FormTextarea
          {...register("description")}
          placeholder="Notes about this service…"
        />
      </FormField>

      {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Create service"}
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
