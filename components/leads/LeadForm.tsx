"use client";

import { useEffect, useState } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type SubmitHandler,
} from "react-hook-form";
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
import { useUsers } from "@/hooks";
import { ApiError, api } from "@/lib/api";
import { formatLabel } from "@/lib/format";
import {
  CreateLeadSchema,
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "@/lib/schemas";
import type { LeadDto } from "@/types/lead";

/**
 * Single Lead form for both create and edit.
 *
 * Validation is driven entirely by the existing `CreateLeadSchema` (input →
 * output via `zodResolver`); the form never re-states field rules. In edit mode
 * the same schema still applies — a full, valid lead is PATCHed, which the
 * partial `UpdateLeadSchema` on the server accepts.
 */

type LeadFormValues = z.input<typeof CreateLeadSchema>;
type LeadFormOutput = z.output<typeof CreateLeadSchema>;

type LeadFormMode = "create" | "edit";

type LeadFormProps = {
  mode: LeadFormMode;
  /** Existing lead to populate the form in edit mode. Ignored on create. */
  lead?: LeadDto;
  onSuccess?: (lead: LeadDto) => void;
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

/** "vip, hot , " → ["vip", "hot"] (trimmed, empties dropped). */
function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/** Build the schema-input defaults from an optional existing lead. */
function buildDefaults(lead?: LeadDto): LeadFormValues {
  return {
    name: lead?.name ?? "",
    email: lead?.email ?? "",
    phone: lead?.phone ?? "",
    company: lead?.company ?? "",
    status: lead?.status ?? "new",
    source: lead?.source ?? "website",
    priority: lead?.priority ?? "medium",
    assignedTo: lead?.assignedTo ?? "",
    message: lead?.message ?? "",
    tags: lead?.tags ?? [],
    lastContactedAt: toDateInputValue(lead?.lastContactedAt),
  };
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function LeadForm({ mode, lead, onSuccess, onCancel }: LeadFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues, unknown, LeadFormOutput>({
    resolver: zodResolver(CreateLeadSchema),
    defaultValues: buildDefaults(lead),
  });

  // Assignment picker options come from the users endpoint (id → name).
  const { data: users, loading: usersLoading } = useUsers();
  const userOptions = users.map((user) => ({
    value: user.id,
    label: user.name,
  }));

  // Tags are a string[] in the schema but edited as one comma-separated field,
  // so we keep the raw text locally and push the parsed array into RHF.
  const [tagsText, setTagsText] = useState(() => lead?.tags.join(", ") ?? "");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Re-populate when the edited lead changes (e.g. navigating between leads).
  useEffect(() => {
    reset(buildDefaults(lead));
    setTagsText(lead?.tags.join(", ") ?? "");
    setSubmitError(null);
  }, [lead, reset]);

  // Conditional field: referral leads capture who referred them.
  const source = useWatch({ control, name: "source" });

  const onSubmit: SubmitHandler<LeadFormOutput> = async (values) => {
    setSubmitError(null);
    try {
      const saved =
        mode === "edit" && lead
          ? await api.patch<LeadDto>(`/api/leads/${lead.id}`, values)
          : await api.post<LeadDto>("/api/leads", values);
      onSuccess?.(saved);
    } catch (error) {
      setSubmitError(
        toErrorMessage(error, "Could not save lead. Please try again."),
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <FormField label="Name" required error={errors.name?.message}>
          <FormInput {...register("name")} placeholder="John Doe" />
        </FormField>

        <FormField label="Phone" required error={errors.phone?.message}>
          <FormInput
            type="tel"
            {...register("phone")}
            placeholder="+91 98765 43210"
          />
        </FormField>

        <FormField label="Email" error={errors.email?.message}>
          <FormInput
            type="email"
            {...register("email")}
            placeholder="john@acme.com"
          />
        </FormField>

        <FormField label="Company" error={errors.company?.message}>
          <FormInput {...register("company")} placeholder="Acme Inc." />
        </FormField>

        <FormField label="Status" error={errors.status?.message}>
          <FormSelect {...register("status")}>
            {LEAD_STATUSES.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value)}
              </option>
            ))}
          </FormSelect>
        </FormField>

        <FormField label="Source" error={errors.source?.message}>
          <FormSelect {...register("source")}>
            {LEAD_SOURCES.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value)}
              </option>
            ))}
          </FormSelect>
        </FormField>

        <FormField label="Priority" error={errors.priority?.message}>
          <FormSelect {...register("priority")}>
            {LEAD_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value)}
              </option>
            ))}
          </FormSelect>
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

        <FormField label="Last contacted" error={errors.lastContactedAt?.message}>
          <FormInput
            type="date"
            {...register("lastContactedAt", {
              // "" is not a date; collapse it to undefined so the optional
              // schema treats a blank field as "not set".
              setValueAs: (value) => (value === "" ? undefined : value),
            })}
          />
        </FormField>

        <FormField
          label="Tags"
          description="Comma-separated, e.g. vip, hot"
          error={errors.tags?.message}
        >
          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <FormInput
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={tagsText}
                onChange={(event) => {
                  setTagsText(event.target.value);
                  field.onChange(splitTags(event.target.value));
                }}
                placeholder="vip, hot"
              />
            )}
          />
        </FormField>
      </div>

      {source === "referral" ? (
        <FormField
          label="Referral details"
          description="Who referred this lead?"
          error={errors.message?.message}
        >
          <FormTextarea {...register("message")} placeholder="Referred by…" />
        </FormField>
      ) : (
        <FormField label="Message" error={errors.message?.message}>
          <FormTextarea
            {...register("message")}
            placeholder="Notes about this lead…"
          />
        </FormField>
      )}

      {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Create lead"}
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
