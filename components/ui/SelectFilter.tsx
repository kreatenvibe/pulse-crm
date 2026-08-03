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
};

export function SelectFilter({
  id,
  label,
  value,
  options,
  onChange,
  allLabel,
}: SelectFilterProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500"
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
