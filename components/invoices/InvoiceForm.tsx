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
} from "@/components/ui";
import { useCustomers, useServices } from "@/hooks";
import { api, toErrorMessage } from "@/lib/api";
import { applyServerFieldErrors } from "@/lib/form-errors";
import { formatCustomerName, formatLabel } from "@/lib/format";
import { CreateInvoiceSchema, INVOICE_STATUSES } from "@/lib/schemas";
import type { InvoiceDto } from "@/types/invoice";

/**
 * Single Invoice form for both create and edit.
 *
 * Validation is driven entirely by the existing `CreateInvoiceSchema` (input →
 * output via `zodResolver`); the form never re-states field rules. In edit mode
 * the same schema still applies — a full, valid invoice is PATCHed, which the
 * partial `UpdateInvoiceSchema` on the server accepts.
 *
 * Money: the schema/DTO store `amountCents` as integer cents. The form shows the
 * amount in whole currency units (nicer to type) and converts at the boundary
 * only — divide by 100 to populate, round × 100 to submit. No monetary rule is
 * duplicated here; `nonNegativeNumber` still validates the number the schema owns.
 *
 * Relationships: `customerId` (required) and `serviceId` (optional) are real
 * schema fields, populated through the shared FormCombobox (id stored, label
 * shown) using the existing customers/services endpoints.
 */

type InvoiceFormValues = z.input<typeof CreateInvoiceSchema>;
type InvoiceFormOutput = z.output<typeof CreateInvoiceSchema>;

type InvoiceFormMode = "create" | "edit";

type InvoiceFormProps = {
  mode: InvoiceFormMode;
  /** Existing invoice to populate the form in edit mode. Ignored on create. */
  invoice?: InvoiceDto;
  onSuccess?: (invoice: InvoiceDto) => void;
  onCancel?: () => void;
};

/** ISO string → the `YYYY-MM-DD` value an <input type="date"> expects. */
function toDateInputValue(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Build the schema-input defaults from an optional existing invoice. */
function buildDefaults(invoice?: InvoiceDto): InvoiceFormValues {
  return {
    customerId: invoice?.customerId ?? "",
    serviceId: invoice?.serviceId ?? "",
    // Stored cents → whole currency units for the input (converted back on submit).
    amountCents: invoice ? invoice.amountCents / 100 : 0,
    currency: invoice?.currency ?? "INR",
    invoiceNumber: invoice?.invoiceNumber ?? "",
    status: invoice?.status ?? "draft",
    issuedAt: toDateInputValue(invoice?.issuedAt),
    dueDate: toDateInputValue(invoice?.dueDate),
  };
}

export function InvoiceForm({
  mode,
  invoice,
  onSuccess,
  onCancel,
}: InvoiceFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues, unknown, InvoiceFormOutput>({
    resolver: zodResolver(CreateInvoiceSchema),
    defaultValues: buildDefaults(invoice),
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  // Picker options from existing endpoints (no new fetching abstraction). Same
  // id → label mapping as the other forms.
  const { data: customers, loading: customersLoading } = useCustomers();
  const { data: services, loading: servicesLoading } = useServices();
  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: formatCustomerName(customer),
  }));
  const serviceOptions = services.map((service) => ({
    value: service.id,
    label: service.title,
  }));

  // Re-populate when the edited invoice changes (e.g. navigating between them).
  useEffect(() => {
    reset(buildDefaults(invoice));
    setSubmitError(null);
  }, [invoice, reset]);

  const onSubmit: SubmitHandler<InvoiceFormOutput> = async (values) => {
    setSubmitError(null);
    // Boundary conversion: the form edits whole currency units; the API/DTO
    // contract is integer cents.
    const payload = {
      ...values,
      amountCents: Math.round(values.amountCents * 100),
    };
    try {
      const saved =
        mode === "edit" && invoice
          ? await api.patch<InvoiceDto>(`/api/invoices/${invoice.id}`, payload)
          : await api.post<InvoiceDto>("/api/invoices", payload);
      onSuccess?.(saved);
    } catch (error) {
      applyServerFieldErrors(error, setError);
      setSubmitError(
        toErrorMessage(error, "Could not save invoice. Please try again."),
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <FormField
          label="Invoice number"
          required
          error={errors.invoiceNumber?.message}
        >
          <FormInput {...register("invoiceNumber")} placeholder="INV-1001" />
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

        <FormCombobox
          control={control}
          name="serviceId"
          label="Service"
          options={serviceOptions}
          isLoading={servicesLoading}
          isClearable
          placeholder="Select a service (optional)"
          error={errors.serviceId?.message}
        />

        <FormField label="Status" error={errors.status?.message}>
          <FormSelect {...register("status")}>
            {INVOICE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value)}
              </option>
            ))}
          </FormSelect>
        </FormField>

        <FormField
          label="Amount"
          required
          description="In whole currency units (e.g. 4999.00)."
          error={errors.amountCents?.message}
        >
          <FormInput
            type="number"
            step="0.01"
            min="0"
            {...register("amountCents", {
              // The numeric input yields a string; the schema owns `z.number()`,
              // so convert here (blank → NaN so the required/number rule fires).
              setValueAs: (value) =>
                value === "" ? Number.NaN : Number(value),
            })}
            placeholder="4999.00"
          />
        </FormField>

        <FormField label="Currency" required error={errors.currency?.message}>
          <FormInput {...register("currency")} placeholder="INR" />
        </FormField>

        <FormField label="Issued date" required error={errors.issuedAt?.message}>
          <FormInput type="date" {...register("issuedAt")} />
        </FormField>

        <FormField label="Due date" required error={errors.dueDate?.message}>
          <FormInput type="date" {...register("dueDate")} />
        </FormField>
      </div>

      {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Create invoice"}
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
