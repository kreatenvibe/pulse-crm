"use client";

import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import Select, {
  type ClassNamesConfig,
  type GroupBase,
} from "react-select";
import { FormField, useFormFieldControl } from "./FormField";

/**
 * Domain-agnostic searchable select. It knows nothing about users, leads, or
 * customers — the consuming form supplies `options` ({ value, label }[]) and the
 * component stores only `option.value` in React Hook Form while displaying the
 * matching `option.label`.
 *
 *   <FormCombobox
 *     control={control}
 *     name="assignedTo"
 *     label="Assigned to"
 *     options={users.map((u) => ({ value: u.id, label: u.name }))}
 *     isLoading={usersLoading}
 *   />
 *
 * Layout/label/error/description all come from the shared FormField, so the
 * hierarchy stays FormCombobox → FormField → react-select control. The repetitive
 * Controller wiring lives here, not at the call site.
 */

export type FormComboboxOption = {
  value: string;
  label: string;
};

type FormComboboxProps<
  TFieldValues extends FieldValues,
  TTransformedValues = TFieldValues,
> = {
  control: Control<TFieldValues, unknown, TTransformedValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  options: FormComboboxOption[];
  placeholder?: string;
  required?: boolean;
  description?: string;
  disabled?: boolean;
  isLoading?: boolean;
  isClearable?: boolean;
  /** RHF message, e.g. errors.assignedTo?.message. */
  error?: string;
  /** Extra classes for the FormField wrapper (e.g. grid column span). */
  className?: string;
};

export function FormCombobox<
  TFieldValues extends FieldValues,
  TTransformedValues = TFieldValues,
>({
  control,
  name,
  label,
  options,
  placeholder = "Select…",
  required = false,
  description,
  disabled = false,
  isLoading = false,
  isClearable = false,
  error,
  className,
}: FormComboboxProps<TFieldValues, TTransformedValues>) {
  return (
    <FormField
      label={label}
      required={required}
      description={description}
      error={error}
      className={className}
    >
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <ComboboxControl
            field={field}
            options={options}
            placeholder={placeholder}
            disabled={disabled}
            isLoading={isLoading}
            isClearable={isClearable}
          />
        )}
      />
    </FormField>
  );
}

type ComboboxControlProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  field: ControllerRenderProps<TFieldValues, TName>;
  options: FormComboboxOption[];
  placeholder: string;
  disabled: boolean;
  isLoading: boolean;
  isClearable: boolean;
};

/**
 * Rendered inside FormField (and inside Controller's render prop is not a
 * component, so this separate component is where we may call the FormField hook)
 * to inherit the field id + aria wiring, and to bridge react-select's option
 * object to RHF's flat string value.
 */
function ComboboxControl<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  field,
  options,
  placeholder,
  disabled,
  isLoading,
  isClearable,
}: ComboboxControlProps<TFieldValues, TName>) {
  const control = useFormFieldControl();
  const invalid = Boolean(control["aria-invalid"]);

  // RHF stores the plain id; find the matching option to show its label. An
  // empty/unknown value resolves to null, which react-select renders as the
  // placeholder.
  const value =
    options.find((option) => option.value === field.value) ?? null;

  return (
    <Select<FormComboboxOption>
      inputId={control.id}
      aria-invalid={control["aria-invalid"]}
      aria-describedby={control["aria-describedby"]}
      name={field.name}
      options={options}
      value={value}
      onChange={(option) => field.onChange(option ? option.value : "")}
      onBlur={field.onBlur}
      placeholder={placeholder}
      isDisabled={disabled}
      isLoading={isLoading}
      isClearable={isClearable}
      unstyled
      classNames={buildClassNames(invalid)}
    />
  );
}

/**
 * Tailwind classes that make react-select match the native FormInput/FormSelect
 * (see fieldStyles.ts): same height, radius, border, focus ring, disabled and
 * error treatment, and theme tokens (no hardcoded colors). `unstyled` strips
 * react-select's defaults so only these apply.
 */
function buildClassNames(
  invalid: boolean,
): ClassNamesConfig<FormComboboxOption, false, GroupBase<FormComboboxOption>> {
  return {
    control: (state) =>
      [
        "flex w-full min-h-[2.375rem] items-center rounded-lg border bg-surface text-sm text-foreground transition-[border-color,box-shadow]",
        state.isDisabled
          ? "cursor-not-allowed opacity-40"
          : "cursor-text hover:border-border-strong",
        invalid
          ? state.isFocused
            ? "border-danger ring-2 ring-danger/20"
            : "border-danger"
          : state.isFocused
            ? "border-brand ring-2 ring-ring/20"
            : "border-border",
      ].join(" "),
    valueContainer: () => "flex flex-1 flex-wrap items-center gap-1 px-3 py-1",
    placeholder: () => "text-foreground-muted",
    input: () => "text-foreground",
    singleValue: () => "text-foreground",
    indicatorsContainer: () => "flex items-center self-stretch",
    indicatorSeparator: () => "hidden",
    dropdownIndicator: (state) =>
      `px-2 text-foreground-muted transition-colors ${
        state.isFocused ? "text-foreground" : ""
      }`,
    clearIndicator: () =>
      "cursor-pointer px-1 text-foreground-muted transition-colors hover:text-foreground",
    loadingIndicator: () => "px-2 text-foreground-muted",
    menu: () =>
      "z-20 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-lg",
    menuList: () => "max-h-60 overflow-y-auto py-1",
    option: (state) =>
      [
        "cursor-pointer px-3 py-2 text-sm",
        state.isSelected
          ? "bg-brand text-foreground-inverse"
          : state.isFocused
            ? "bg-surface-muted text-foreground"
            : "text-foreground",
      ].join(" "),
    noOptionsMessage: () => "px-3 py-2 text-sm text-foreground-muted",
    loadingMessage: () => "px-3 py-2 text-sm text-foreground-muted",
  };
}
