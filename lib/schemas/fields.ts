import { z } from "zod";

/**
 * Reusable field-level schema builders that encode the project's pure-input
 * rules once, matching the behavior of the old `services/validation.ts`
 * primitives:
 *
 *  - `requiredText`  ← assertRequiredString (trim, must be non-empty)
 *  - `optionalText`  ← assertOptionalString (null/undefined/"" → undefined, else trimmed)
 *  - `requiredDate`  ← toDate (coerce string/number/Date; reject null/invalid)
 *  - `optionalDate`  ← toOptionalDate (null/undefined → undefined, else coerce)
 *  - `nonNegativeNumber` ← assertPositiveNumber (finite number >= 0)
 *  - `requiredTags`  ← assertTags (array of non-empty trimmed strings)
 *
 * Pure Zod only — safe to import from the client.
 */

export function requiredText(field: string) {
  return z.string().trim().min(1, `${field} is required`);
}

/**
 * Optional free text: null/undefined/empty collapse to `undefined`, else trimmed.
 * `.optional()` comes last so the object key is optional (`field?: string`),
 * matching the old `assertOptionalString` contract.
 */
export function optionalText() {
  return z
    .union([z.string(), z.null()])
    .transform((value) => {
      if (value === null) return undefined;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    })
    .optional();
}

/** Required date: accepts Date | string | number; rejects null and invalid. */
export function requiredDate() {
  return z.preprocess((value) => (value === null ? undefined : value), z.coerce.date());
}

/** Optional date: null/undefined → undefined; otherwise coerced (invalid rejected). */
export function optionalDate() {
  return z.preprocess(
    (value) => (value === null || value === undefined ? undefined : value),
    z.coerce.date().optional(),
  );
}

export function nonNegativeNumber(field: string) {
  return z
    .number()
    .finite()
    .min(0, `${field} must be a non-negative number`);
}

/** Array of non-empty, trimmed strings (used for lead tags). */
export function requiredTags() {
  return z.array(requiredText("tag"));
}
