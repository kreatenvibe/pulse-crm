import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { getErrorDetails } from "@/lib/api";

/**
 * Map an `ApiError`'s field-level `details` onto react-hook-form fields.
 * No-op unless the server returned structured validation details, so the
 * general `submitError` banner still covers 404/409/500 and detail-less errors.
 * Returns true if at least one field error was applied.
 */
export function applyServerFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  const details = getErrorDetails(error);
  if (!details) return false;

  let applied = false;
  for (const [field, messages] of Object.entries(details)) {
    // `_form` groups non-field issues; leave those to the banner.
    if (field === "_form" || !messages?.length) continue;
    setError(field as Path<T>, { type: "server", message: messages[0] });
    applied = true;
  }
  return applied;
}
