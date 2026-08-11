"use client";

import type { ComponentPropsWithRef } from "react";
import { fieldClassName } from "./fieldStyles";
import { useFormFieldControl } from "./FormField";

type FormTextareaProps = ComponentPropsWithRef<"textarea">;

/**
 * Styled <textarea> for multi-line fields (notes, messages). Works with React
 * Hook Form's `register`; defaults to 3 rows and inherits FormField's a11y wiring.
 */
export function FormTextarea({
  id,
  className = "",
  rows = 3,
  ...props
}: FormTextareaProps) {
  const control = useFormFieldControl(id);

  return (
    <textarea
      rows={rows}
      {...control}
      {...props}
      className={`${fieldClassName} ${className}`}
    />
  );
}
