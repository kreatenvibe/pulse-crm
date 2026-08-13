"use client";

/**
 * Segmented control: a compact single-choice picker where every option is
 * visible at once (a denser alternative to a dropdown for 2–3 short choices).
 *
 * It is controlled — pass `value` and `onChange` — because it usually drives
 * local UI state (e.g. which relationship a task links to) rather than a schema
 * field. Real radios stay in the DOM (sr-only) for keyboard + a11y; the styled
 * labels carry the visible active state.
 *
 *   <FormSegmented
 *     label="Link task to"
 *     name="taskLink"
 *     value={linkType}
 *     onChange={setLinkType}
 *     options={[{ value: "lead", label: "Lead" }, { value: "customer", label: "Customer" }]}
 *   />
 */

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type FormSegmentedProps<T extends string> = {
  label: string;
  /** Radio group name — must be unique per control on the page. */
  name: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Extra classes for the fieldset wrapper (e.g. grid column span). */
  className?: string;
};

export function FormSegmented<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
  className = "",
}: FormSegmentedProps<T>) {
  return (
    <fieldset className={className}>
      <legend className="mb-1 text-sm font-medium text-foreground">
        {label}
      </legend>
      <div className="flex gap-1 rounded-lg border border-border bg-surface-muted p-1">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex flex-1 cursor-pointer items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-focus-ring ${
              value === option.value
                ? "border border-brand bg-brand-soft text-brand"
                : "border border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
