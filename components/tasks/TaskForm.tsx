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
import { CreateTaskSchema, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/schemas";
import type { TaskDto } from "@/types/task";

/**
 * Single Task form for both create and edit.
 *
 * Validation is driven entirely by the existing `CreateTaskSchema` (input →
 * output via `zodResolver`); the form never re-states field rules. In edit mode
 * the same schema still applies — a full, valid task is PATCHed, which the
 * partial `UpdateTaskSchema` on the server accepts.
 *
 * The lead/customer link is exactly-one-of, enforced (with existence) in the
 * service; the two id inputs stay plain here and surface the server's error via
 * the existing ApiError pattern.
 */

type TaskFormValues = z.input<typeof CreateTaskSchema>;
type TaskFormOutput = z.output<typeof CreateTaskSchema>;

type TaskFormMode = "create" | "edit";

type TaskFormProps = {
  mode: TaskFormMode;
  /** Existing task to populate the form in edit mode. Ignored on create. */
  task?: TaskDto;
  onSuccess?: (task: TaskDto) => void;
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

/** Which relationship the task is linked to. Local UI state, not a schema field. */
type TaskLink = "lead" | "customer";

/** Detect the existing link so edit mode opens the correct selector. */
function initialLink(task?: TaskDto): TaskLink {
  return task?.customerId ? "customer" : "lead";
}

/** Build the schema-input defaults from an optional existing task. */
function buildDefaults(task?: TaskDto): TaskFormValues {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    assignedTo: task?.assignedTo ?? "",
    leadId: task?.leadId ?? "",
    customerId: task?.customerId ?? "",
    dueDate: toDateInputValue(task?.dueDate),
    priority: task?.priority ?? "medium",
    status: task?.status ?? "todo",
  };
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function TaskForm({ mode, task, onSuccess, onCancel }: TaskFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues, unknown, TaskFormOutput>({
    resolver: zodResolver(CreateTaskSchema),
    defaultValues: buildDefaults(task),
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
  // radio picks which relationship applies; the two ids stay real schema fields.
  const [linkType, setLinkType] = useState<TaskLink>(() => initialLink(task));

  // Re-populate when the edited task changes (e.g. navigating between tasks).
  useEffect(() => {
    reset(buildDefaults(task));
    setLinkType(initialLink(task));
    setSubmitError(null);
  }, [task, reset]);

  // Keep the non-selected relationship cleared so exactly one id is ever
  // submitted. useWatch (not watch()) drives this reactively, matching the
  // project's conditional-field pattern.
  const inactiveName = linkType === "lead" ? "customerId" : "leadId";
  const inactiveValue = useWatch({ control, name: inactiveName });
  useEffect(() => {
    if (inactiveValue) setValue(inactiveName, "");
  }, [inactiveName, inactiveValue, setValue]);

  const onSubmit: SubmitHandler<TaskFormOutput> = async (values) => {
    setSubmitError(null);
    try {
      const saved =
        mode === "edit" && task
          ? await api.patch<TaskDto>(`/api/tasks/${task.id}`, values)
          : await api.post<TaskDto>("/api/tasks", values);
      onSuccess?.(saved);
    } catch (error) {
      setSubmitError(
        toErrorMessage(error, "Could not save task. Please try again."),
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <FormField label="Title" required error={errors.title?.message}>
          <FormInput {...register("title")} placeholder="Follow up call" />
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

        <FormField label="Due date" required error={errors.dueDate?.message}>
          <FormInput type="date" {...register("dueDate")} />
        </FormField>

        <FormField label="Priority" error={errors.priority?.message}>
          <FormSelect {...register("priority")}>
            {TASK_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value)}
              </option>
            ))}
          </FormSelect>
        </FormField>

        <FormField label="Status" error={errors.status?.message}>
          <FormSelect {...register("status")}>
            {TASK_STATUSES.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value)}
              </option>
            ))}
          </FormSelect>
        </FormField>

        <div className="sm:col-span-2">
          <FormSegmented
            label="Link task to"
            name="taskLink"
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

      <FormField label="Description" error={errors.description?.message}>
        <FormTextarea
          {...register("description")}
          placeholder="Notes about this task…"
        />
      </FormField>

      {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Create task"}
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
