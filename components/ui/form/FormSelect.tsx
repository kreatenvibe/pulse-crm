"use client";

import type { ComponentPropsWithRef } from "react";
import { fieldClassName } from "./fieldStyles";
import { useFormFieldControl } from "./FormField";

type FormSelectProps = ComponentPropsWithRef<"select">;

/**
 * Styled <select> that works with React Hook Form's `register`. Render the
 * <option> children explicitly at the call site (usually mapped from a shared
 * enum array like LEAD_STATUSES) so the options stay obvious and typed.
 */
export function FormSelect({
  id,
  className = "",
  children,
  ...props
}: FormSelectProps) {
  const control = useFormFieldControl(id);

  return (
    <select
      {...control}
      {...props}
      className={`${fieldClassName} ${className}`}
    >
      {children}
    </select>
  );
}
