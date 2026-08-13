import type { ReactNode } from "react";

type FilterBarProps = {
  children: ReactNode;
};

/**
 * Canonical filter container for list pages: a full-width section with a bottom
 * divider and shell padding matching PageHeader. Intentionally dumb — it knows
 * nothing about search, selects, filter state, or domain entities. Feature
 * `*Filters` components own their own contents and lay them out via children.
 */
export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="border-b border-border px-5 py-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
