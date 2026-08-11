"use client";

import type { ComponentPropsWithRef } from "react";
import { fieldClassName } from "./fieldStyles";
import { useFormFieldControl } from "./FormField";

type FormInputProps = ComponentPropsWithRef<"input">;

/**
 * Styled <input> that works directly with React Hook Form's `register`
 * (name/onChange/onBlur/ref are spread through). Pass `type` for email, tel,
 * date, datetime-local, number, etc. Inherits id + aria wiring from FormField.
 */
export function FormInput({ id, className = "", ...props }: FormInputProps) {
  const control = useFormFieldControl(id);

  return (
    <input
      type="text"
      {...control}
      {...props}
      className={`${fieldClassName} ${className}`}
    />
  );
}
