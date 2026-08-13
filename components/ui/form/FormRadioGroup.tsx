"use client";

import type { ComponentPropsWithRef } from "react";
import { FormError } from "./FormError";

/**
 * A labeled group of radio options. Works directly with React Hook Form's
 * `register` — spread it and the same name/onChange/onBlur/ref land on every
 * radio, while each option supplies its own `value`:
 *
 *   <FormRadioGroup
 *     label="Contact preference"
 *     options={[{ value: "email", label: "Email" }, …]}
 *     error={errors.contactPreference?.message}
 *     {...register("contactPreference")}
 *   />
 *
 * Uses a fieldset/legend (correct grouping semantics) instead of FormField's
 * single label-for-control, so it renders its own label/description/error.
 */

type RadioOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type FormRadioGroupProps = Omit<
  ComponentPropsWithRef<"input">,
  "type" | "value" | "children"
> & {
  label: string;
  options: RadioOption[];
  description?: string;
  /** RHF message, e.g. errors.contactPreference?.message. */
  error?: string;
  required?: boolean;
  /** Stack options vertically (default) or lay them out in a wrapping row. */
  orientation?: "vertical" | "horizontal";
  /** Extra classes for the fieldset wrapper (e.g. grid column span). */
  className?: string;
};

export function FormRadioGroup({
  label,
  options,
  description,
  error,
  required = false,
  orientation = "vertical",
  className = "",
  ...radioProps
}: FormRadioGroupProps) {
  const invalid = Boolean(error);

  return (
    <fieldset className={`flex flex-col ${className}`} aria-invalid={invalid || undefined}>
      <legend className="mb-1 text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        ) : null}
      </legend>

      <div
        className={
          orientation === "horizontal"
            ? "flex flex-wrap gap-x-5 gap-y-2"
            : "flex flex-col gap-2"
        }
      >
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer select-none items-start gap-2 text-sm text-foreground has-disabled:cursor-not-allowed has-disabled:opacity-40"
          >
            <input
              type="radio"
              value={option.value}
              disabled={option.disabled}
              className="mt-0.5 h-4 w-4 accent-brand"
              {...radioProps}
            />
            <span className="flex flex-col">
              <span>{option.label}</span>
              {option.description ? (
                <span className="text-xs text-foreground-muted">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>

      {description ? (
        <p className="mt-1 text-xs leading-4 text-foreground-muted">
          {description}
        </p>
      ) : null}
      {error ? <FormError message={error} className="mt-1" /> : null}
    </fieldset>
  );
}
