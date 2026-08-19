/**
 * Transport-agnostic error taxonomy for the service layer.
 *
 * Services throw `ServiceError` with one of these codes; the API boundary
 * (`lib/api-route.ts`) maps each code to an HTTP status and a deterministic
 * response body. Nothing here knows about HTTP.
 *
 * `UNAUTHORIZED` is thrown by `services/auth.service.ts` (invalid credentials,
 * invalid/expired session). `FORBIDDEN` remains reserved for a future RBAC
 * milestone — nothing throws it yet.
 */
export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL";

/** Field-level validation details, e.g. `{ email: ["Invalid email"] }`. */
export type ErrorDetails = Record<string, string[]>;

export class ServiceError extends Error {
  readonly code: ErrorCode;
  readonly details?: ErrorDetails;

  constructor(message: string, code: ErrorCode, details?: ErrorDetails) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Small factory helpers over the existing taxonomy. They return plain
 * `ServiceError` instances (no subclasses) so call sites read as intent
 * (`throw notFound("Lead not found")`) while the type stays uniform.
 */
export function notFound(message: string, details?: ErrorDetails): ServiceError {
  return new ServiceError(message, "NOT_FOUND", details);
}

export function conflict(message: string, details?: ErrorDetails): ServiceError {
  return new ServiceError(message, "CONFLICT", details);
}

export function unauthorized(message: string, details?: ErrorDetails): ServiceError {
  return new ServiceError(message, "UNAUTHORIZED", details);
}

export function validation(
  message: string,
  details?: ErrorDetails,
): ServiceError {
  return new ServiceError(message, "VALIDATION", details);
}
