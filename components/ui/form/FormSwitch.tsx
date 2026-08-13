"use client";

import type { ComponentPropsWithRef } from "react";

/**
 * A toggle switch — a styled checkbox for on/off settings. Works with React Hook
 * Form's `register` (it is a checkbox under the hood):
 *
 *   <FormSwitch
 *     label="Enable follow-up reminders"
 *     description="Create a task automatically when a lead needs follow-up."
 *     {...register("followUpReminders")}
 *   />
 *
 * The real checkbox is visually hidden (`peer`) and drives the track/thumb state.
 */

type FormSwitchProps = Omit<ComponentPropsWithRef<"input">, "type"> & {
  label: string;
  description?: string;
};

export function FormSwitch({
  label,
  description,
  className = "",
  ...props
}: FormSwitchProps) {
  return (
    <label
      className={`flex cursor-pointer select-none items-start justify-between gap-3 has-disabled:cursor-not-allowed has-disabled:opacity-40 ${className}`}
    >
      <span className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description ? (
          <span className="text-xs text-foreground-muted">{description}</span>
        ) : null}
      </span>

      <span className="relative inline-flex shrink-0 items-center">
        <input type="checkbox" className="peer sr-only" {...props} />
        <span className="h-5 w-9 rounded-full bg-surface-container-highest transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring" />
        <span className="absolute left-0.5 h-4 w-4 rounded-full bg-surface-container-lowest shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}
