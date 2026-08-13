"use client";

import type { ComponentPropsWithRef } from "react";

/**
 * A single checkbox with an inline label and optional helper text. Works with
 * React Hook Form's `register` (name/onChange/onBlur/ref spread through):
 *
 *   <FormCheckbox label="Send email notifications" {...register("emailOptIn")} />
 *
 * For a set of related choices, render several of these under a shared heading —
 * each maps to its own boolean field.
 */

type FormCheckboxProps = Omit<ComponentPropsWithRef<"input">, "type"> & {
  label: string;
  description?: string;
};

export function FormCheckbox({
  label,
  description,
  className = "",
  ...props
}: FormCheckboxProps) {
  return (
    <label
      className={`flex cursor-pointer select-none items-start gap-2 text-sm text-foreground has-disabled:cursor-not-allowed has-disabled:opacity-40 ${className}`}
    >
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded accent-brand"
        {...props}
      />
      <span className="flex flex-col">
        <span>{label}</span>
        {description ? (
          <span className="text-xs text-foreground-muted">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
