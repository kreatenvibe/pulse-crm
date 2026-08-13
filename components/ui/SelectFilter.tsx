"use client";

import Select, {
  type ClassNamesConfig,
  type GroupBase,
} from "react-select";

type SelectOption = {
  value: string;
  label: string;
};

type SelectFilterProps = {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  allLabel?: string;
  className?: string;
  /** Hide the visible label (still associated via aria-label). */
  hideLabel?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
};

/**
 * Generic list/table filter control. Built on react-select so every CRM filter
 * (leads, customers, tasks, appointments, invoices, services) shares one
 * searchable, consistent dropdown. The public API stays primitive: `value` and
 * `onChange` are plain strings — the empty string maps to the `allLabel`
 * ("All …") option — so filtering semantics and query params are unchanged.
 *
 * This is the filter counterpart to FormCombobox: FormCombobox is for React
 * Hook Form fields; SelectFilter is for page/table filters driven by local
 * state. Do not add per-filter wrappers (StatusFilter, PriorityFilter, …) — pass
 * options here instead.
 */
export function SelectFilter({
  id,
  label,
  value,
  options,
  onChange,
  allLabel,
  className = "",
  hideLabel = false,
  disabled = false,
  isLoading = false,
}: SelectFilterProps) {
  // When an "All" label is provided, expose it as a real selectable option with
  // the empty-string value, mirroring the previous native <select> behavior:
  // selecting it resets the filter (emits "") and shows the "All …" label.
  const resolvedOptions: SelectOption[] =
    allLabel !== undefined
      ? [{ value: "", label: allLabel }, ...options]
      : options;

  const selected =
    resolvedOptions.find((option) => option.value === value) ?? null;

  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      {hideLabel ? (
        <span className="sr-only">{label}</span>
      ) : (
        <label
          htmlFor={id}
          className="text-xs font-medium text-foreground-secondary"
        >
          {label}
        </label>
      )}
      <Select<SelectOption>
        instanceId={id}
        inputId={id}
        aria-label={hideLabel ? label : undefined}
        options={resolvedOptions}
        value={selected}
        onChange={(option) => onChange(option ? option.value : "")}
        isDisabled={disabled}
        isLoading={isLoading}
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : undefined
        }
        menuPosition="fixed"
        unstyled
        classNames={filterClassNames}
      />
    </div>
  );
}

/**
 * Tailwind classes that make react-select match the app's native filter box (see
 * SearchInput / the previous native SelectFilter): h-9, hairline outline, red
 * focus ring, MD3 surface tokens. `unstyled` strips react-select's defaults so
 * only these apply.
 */
const filterClassNames: ClassNamesConfig<
  SelectOption,
  false,
  GroupBase<SelectOption>
> = {
  control: (state) =>
    [
      "flex h-9 w-full min-w-34 items-center rounded border bg-surface-container-lowest text-sm text-on-surface transition-[border-color,box-shadow]",
      state.isDisabled
        ? "cursor-not-allowed opacity-40"
        : "cursor-pointer hover:border-outline",
      state.isFocused
        ? "border-brand ring-2 ring-focus-ring"
        : "border-outline-variant",
    ].join(" "),
  valueContainer: () => "flex flex-1 items-center gap-1 pr-1 pl-3",
  placeholder: () => "text-secondary",
  input: () => "text-on-surface",
  singleValue: () => "text-on-surface",
  indicatorsContainer: () => "flex items-center self-stretch",
  indicatorSeparator: () => "hidden",
  dropdownIndicator: () => "px-2 text-secondary",
  loadingIndicator: () => "px-2 text-secondary",
  menu: () =>
    "z-30 mt-1 overflow-hidden rounded border border-outline-variant bg-surface-container-lowest shadow-soft",
  menuPortal: () => "z-50",
  menuList: () => "max-h-60 overflow-y-auto py-1",
  option: (state) =>
    [
      "cursor-pointer px-3 py-2 text-sm",
      state.isSelected
        ? "bg-brand text-foreground-inverse"
        : state.isFocused
          ? "bg-surface-container-low text-on-surface"
          : "text-on-surface",
    ].join(" "),
  noOptionsMessage: () => "px-3 py-2 text-sm text-secondary",
  loadingMessage: () => "px-3 py-2 text-sm text-secondary",
};
