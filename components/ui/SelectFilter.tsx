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
};

export function SelectFilter({
  id,
  label,
  value,
  options,
  onChange,
  allLabel,
  className = "",
  hideLabel = false,
}: SelectFilterProps) {
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
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={hideLabel ? label : undefined}
        className="h-9 min-w-[8.5rem] rounded-lg border border-border bg-surface px-2.5 text-sm text-foreground shadow-card outline-none transition-[border-color,box-shadow] hover:border-border-strong focus:border-brand focus:ring-2 focus:ring-ring/20"
      >
        {allLabel !== undefined ? (
          <option value="">{allLabel}</option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
