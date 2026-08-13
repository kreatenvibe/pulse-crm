// types/api.ts

import type { PaginationMeta } from "./common";

/**
 * The deterministic API response envelope shared by the route boundary
 * (`lib/api-route.ts`) and the client (`lib/api.ts`).
 *
 * Runtime shape:
 *   success → { success: true, data, pagination? }
 *   error   → { success: false, error: { message, details? } }
 */

/** Field-level validation details, e.g. `{ email: ["Invalid email"] }`. */
export type ApiErrorDetails = Record<string, string[]>;

/** Error payload nested under a failure envelope. */
export type ApiErrorPayload = {
  message: string;
  details?: ApiErrorDetails;
};

/** Failure envelope: `{ success: false, error: { message, details? } }`. */
export type ApiErrorResponse = {
  success: false;
  error: ApiErrorPayload;
};

/**
 * Success envelope: `{ success: true, data, pagination? }`. `pagination` is
 * present only for list endpoints.
 */
export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  pagination?: PaginationMeta;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
