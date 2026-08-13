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
import { useLeads, useUsers } from "@/hooks";
import { ApiError, api } from "@/lib/api";
import { formatLabel } from "@/lib/format";
import { CreateCustomerSchema, CUSTOMER_LIFECYCLE_STATUSES } from "@/lib/schemas";
import type { CustomerDto } from "@/types/customer";

/**
 * Single Customer form for both create and edit.
 *
 * Validation is driven entirely by the existing `CreateCustomerSchema` (input →
 * output via `zodResolver`); the form never re-states field rules. In edit mode
 * the same schema still applies — a full, valid customer is PATCHed, which the
 * partial `UpdateCustomerSchema` on the server accepts.
 */

type CustomerFormValues = z.input<typeof CreateCustomerSchema>;
type CustomerFormOutput = z.output<typeof CreateCustomerSchema>;

type CustomerFormMode = "create" | "edit";

type CustomerFormProps = {
  mode: CustomerFormMode;
  /** Existing customer to populate the form in edit mode. Ignored on create. */
  customer?: CustomerDto;
  onSuccess?: (customer: CustomerDto) => void;
  onCancel?: () => void;
};

/** Build the schema-input defaults from an optional existing customer. */
function buildDefaults(customer?: CustomerDto): CustomerFormValues {
  return {
    leadId: customer?.leadId ?? "",
    businessName: customer?.businessName ?? "",
    primaryContact: customer?.primaryContact ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    address: customer?.address ?? "",
    assignedTo: customer?.assignedTo ?? "",
    lifecycleStatus: customer?.lifecycleStatus ?? "onboarding",
  };
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function CustomerForm({
  mode,
  customer,
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues, unknown, CustomerFormOutput>({
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: buildDefaults(customer),
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  // Picker options from existing endpoints (no new fetching abstraction).
  const { data: users, loading: usersLoading } = useUsers();
  const { data: leads, loading: leadsLoading } = useLeads();
  const userOptions = users.map((user) => ({
    value: user.id,
    label: user.name,
  }));
  const leadOptions = leads.map((lead) => ({
    value: lead.id,
    label: lead.company ? `${lead.name} — ${lead.company}` : lead.name,
  }));

  // Re-populate when the edited customer changes (e.g. navigating between them).
  useEffect(() => {
    reset(buildDefaults(customer));
    setSubmitError(null);
  }, [customer, reset]);

  const onSubmit: SubmitHandler<CustomerFormOutput> = async (values) => {
    setSubmitError(null);
    try {
      const saved =
        mode === "edit" && customer
          ? await api.patch<CustomerDto>(`/api/customers/${customer.id}`, values)
          : await api.post<CustomerDto>("/api/customers", values);
      onSuccess?.(saved);
    } catch (error) {
      setSubmitError(
        toErrorMessage(error, "Could not save customer. Please try again."),
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <FormField
          label="Primary contact"
          required
          error={errors.primaryContact?.message}
        >
          <FormInput {...register("primaryContact")} placeholder="John Doe" />
        </FormField>

        <FormField label="Phone" required error={errors.phone?.message}>
          <FormInput
            type="tel"
            {...register("phone")}
            placeholder="+91 98765 43210"
          />
        </FormField>

        <FormField label="Business name" error={errors.businessName?.message}>
          <FormInput {...register("businessName")} placeholder="Acme Inc." />
        </FormField>

        <FormField label="Email" error={errors.email?.message}>
          <FormInput
            type="email"
            {...register("email")}
            placeholder="john@acme.com"
          />
        </FormField>

        <FormCombobox
          control={control}
          name="leadId"
          label="Source lead"
          required
          options={leadOptions}
          isLoading={leadsLoading}
          isClearable
          placeholder="Select a lead"
          error={errors.leadId?.message}
        />

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

        <FormField
          label="Lifecycle status"
          error={errors.lifecycleStatus?.message}
        >
          <FormSelect {...register("lifecycleStatus")}>
            {CUSTOMER_LIFECYCLE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value)}
              </option>
            ))}
          </FormSelect>
        </FormField>
      </div>

      <FormField label="Address" error={errors.address?.message}>
        <FormTextarea
          {...register("address")}
          placeholder="Street, city, state…"
        />
      </FormField>

      {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Create customer"}
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
