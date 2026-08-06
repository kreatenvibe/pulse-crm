import { Search } from "lucide-react";

type SearchInputProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Hide the visible label (still associated via aria-label). */
  hideLabel?: boolean;
};

export function SearchInput({
  id = "search",
  label = "Search",
  value,
  onChange,
  placeholder = "Search…",
  className = "w-full min-w-0 flex-1 sm:max-w-md",
  hideLabel = false,
}: SearchInputProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
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
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground-muted stroke-[1.5]"
          aria-hidden
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={hideLabel ? label : undefined}
          className="h-9 w-full rounded-lg border border-border bg-surface py-2 pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-foreground-muted transition-[border-color,box-shadow] hover:border-border-strong focus:border-brand focus:ring-2 focus:ring-ring/20"
        />
      </div>
    </div>
  );
}
