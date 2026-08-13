import { z, type ZodError, type ZodType } from "zod";
import { ServiceError, type ErrorDetails } from "./errors";

/**
 * Pure input parsing. No database access — bridges a Zod validation failure to
 * the existing `ServiceError` contract so the API keeps returning `VALIDATION`
 * (HTTP 400). DB-backed / business validation lives in `./validation`.
 */

/**
 * Convert a Zod error into field-level `details` (`{ field: [messages] }`).
 * Root/refine issues with no path are grouped under `_form`. Shared with the
 * API boundary so a Zod error reaching a route produces the same shape.
 */
export function zodFieldErrors(error: ZodError): ErrorDetails {
  const flat = z.flattenError(error);
  const fieldErrors = flat.fieldErrors as Record<string, string[] | undefined>;
  const details: ErrorDetails = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages && messages.length > 0) details[field] = messages;
  }
  if (flat.formErrors.length > 0) details._form = flat.formErrors;
  return details;
}

/**
 * Parse raw input against a Zod schema, throwing `ServiceError("VALIDATION")`.
 * The first issue becomes the human-readable `message`; every field issue is
 * preserved in `details` so clients can render field-level errors.
 */
export function parseInput<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join(".");
    const message = issue
      ? path
        ? `${path}: ${issue.message}`
        : issue.message
      : "Invalid input";
    throw new ServiceError(message, "VALIDATION", zodFieldErrors(result.error));
  }
  return result.data;
}
