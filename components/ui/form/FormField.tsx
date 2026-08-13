"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { FormError } from "./FormError";

/**
 * FormField owns the label, optional description, required marker and error
 * message for one control, and wires up the accessibility relationships. It
 * does NOT own business logic — validation and state stay with React Hook Form.
 *
 * The control it wraps (FormInput/FormSelect/FormTextarea) reads this context
 * to pick up a matching `id`, `aria-invalid`, and `aria-describedby`, so callers
 * never thread ids by hand:
 *
 *   <FormField label="Name" error={errors.name?.message}>
 *     <FormInput {...register("name")} placeholder="John Doe" />
 *   </FormField>
 */

type FormFieldContextValue = {
  controlId: string;
  errorId: string;
  descriptionId?: string;
  invalid: boolean;
};

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

/**
 * Props a control should spread onto its underlying element to inherit the
 * enclosing FormField's id and aria wiring. When used outside a FormField, only
 * the explicit id (if any) is returned.
 */
export function useFormFieldControl(explicitId?: string) {
  const field = useContext(FormFieldContext);
  if (!field) return { id: explicitId };

  const describedBy =
    [field.descriptionId, field.invalid ? field.errorId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  return {
    id: explicitId ?? field.controlId,
    "aria-invalid": field.invalid || undefined,
    "aria-describedby": describedBy,
  };
}

type FormFieldProps = {
  label: string;
  /** RHF message, e.g. errors.name?.message. Presence flips the field to invalid. */
  error?: string;
  /** Optional helper text rendered under the label and linked via aria-describedby. */
  description?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

export function FormField({
  label,
  error,
  description,
  required = false,
  className = "",
  children,
}: FormFieldProps) {
  const uid = useId();
  const controlId = `${uid}-control`;
  const errorId = `${uid}-error`;
  const descriptionId = description ? `${uid}-description` : undefined;
  const invalid = Boolean(error);

  return (
    <FormFieldContext.Provider
      value={{ controlId, errorId, descriptionId, invalid }}
    >
      <div className={`flex flex-col ${className}`}>
        <label
          htmlFor={controlId}
          className="mb-1 text-sm font-medium text-foreground"
        >
          {label}
          {required ? (
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          ) : null}
        </label>
        {children}
        {/* Helper text and error sit below the control (like the field mockups)
            and are rendered only when present — no reserved blank lines, which is
            what kept the old forms so tall. Rows may differ slightly in height
            across grid columns; that is the intended density trade. */}
        {description ? (
          <p
            id={descriptionId}
            className="mt-1 text-xs leading-4 text-foreground-muted"
          >
            {description}
          </p>
        ) : null}
        {error ? <FormError id={errorId} message={error} className="mt-1" /> : null}
      </div>
    </FormFieldContext.Provider>
  );
}
