"use client";

/**
 * Reference example — NOT a shipped feature and NOT the real Lead form (Step 3).
 *
 * Its only jobs are to:
 *   1. prove React Hook Form can consume an existing Zod schema through
 *      `zodResolver(CreateLeadSchema)` (no second/client-only schema), and
 *   2. show how the form primitives compose with `register`, error messages,
 *      and a conditional field driven by `watch()`.
 *
 * It is intentionally left out of `./index.ts` so nothing imports it by accident.
 * The pattern here is schema-agnostic; CreateLeadSchema is used only because it
 * is the richest schema already present.
 */

import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  CreateLeadSchema,
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "@/lib/schemas";
import { formatLabel } from "@/lib/format";
import { Button } from "@/components/ui";
import { FormField } from "./FormField";
import { FormInput } from "./FormInput";
import { FormSelect } from "./FormSelect";
import { FormTextarea } from "./FormTextarea";

// The form edits the schema's *input* shape; a valid submit yields its *output*.
type LeadFormValues = z.input<typeof CreateLeadSchema>;
type LeadFormOutput = z.output<typeof CreateLeadSchema>;

export function FormPrimitivesExample() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues, unknown, LeadFormOutput>({
    resolver: zodResolver(CreateLeadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "new",
      source: "website",
      priority: "medium",
      assignedTo: "",
      message: "",
      tags: [],
    },
  });

  // Conditional fields are just RHF `useWatch()` + JSX — no engine required.
  // (`useWatch` over `watch()` keeps React Compiler happy.)
  const source = useWatch({ control, name: "source" });

  const onSubmit: SubmitHandler<LeadFormOutput> = (values) => {
    // Reference only: Zod has already parsed/transformed `values`. No API call.
    void values;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
      <FormField label="Name" required error={errors.name?.message}>
        <FormInput {...register("name")} placeholder="John Doe" />
      </FormField>

      <FormField label="Phone" required error={errors.phone?.message}>
        <FormInput type="tel" {...register("phone")} placeholder="+91 98765 43210" />
      </FormField>

      <FormField label="Email" error={errors.email?.message}>
        <FormInput type="email" {...register("email")} placeholder="john@acme.com" />
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

      {/* Conditional field: only relevant when the lead came from a referral. */}
      {source === "referral" ? (
        <FormField
          label="Referral details"
          description="Who referred this lead?"
          error={errors.message?.message}
        >
          <FormTextarea {...register("message")} placeholder="Referred by…" />
        </FormField>
      ) : null}

      <FormField label="Status" error={errors.status?.message}>
        <FormSelect {...register("status")}>
          {LEAD_STATUSES.map((value) => (
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

      <FormField label="Assigned to" required error={errors.assignedTo?.message}>
        <FormInput {...register("assignedTo")} placeholder="user-001" />
      </FormField>

      <Button type="submit" variant="primary" disabled={isSubmitting}>
        Save lead
      </Button>
    </form>
  );
}
