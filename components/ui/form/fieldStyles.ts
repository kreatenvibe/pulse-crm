/**
 * Shared control styling for form primitives.
 *
 * Mirrors the existing input treatment used across the app (see LeadActions,
 * SelectFilter, SearchInput) so form fields look native to Pulse CRM. Kept as a
 * single constant because three primitives (input, select, textarea) render the
 * same box — the one spot where sharing beats duplication.
 *
 * `aria-invalid:` variants recolor the border when a field reports an error;
 * FormField sets `aria-invalid` automatically via context.
 */
export const fieldClassName =
  "w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition-[border-color,box-shadow] placeholder:text-secondary hover:border-outline focus:border-brand focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-error aria-invalid:focus:border-error aria-invalid:focus:ring-focus-ring-danger";
