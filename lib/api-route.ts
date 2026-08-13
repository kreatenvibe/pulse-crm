import { ZodError } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import type { PaginatedResult } from "@/types/common";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/types/api";
import {
  ServiceError,
  type ErrorCode,
  type ErrorDetails,
} from "@/services/errors";
import { zodFieldErrors } from "@/services/parse";

/**
 * The single place HTTP concerns live for the API. Route handlers stay thin:
 * parse → call a service → return a success helper. Anything thrown is turned
 * into the deterministic error contract by `withApiErrors` / `apiErrorResponse`.
 *
 * Response contract:
 *   success → { success: true, data, pagination? }
 *   error   → { success: false, error: { message, details? } }
 */

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

function errorResponse(
  status: number,
  message: string,
  details?: ErrorDetails,
): Response {
  const body: ApiErrorResponse = {
    success: false,
    error: details ? { message, details } : { message },
  };
  return Response.json(body, { status });
}

/**
 * Map any thrown value to the deterministic error contract. Known error types
 * become their intended status; everything else is logged server-side and
 * returned as a generic 500 — no internal/Prisma/SQL/stack detail ever leaks.
 */
export function apiErrorResponse(error: unknown): Response {
  if (error instanceof ServiceError) {
    return errorResponse(
      STATUS_BY_CODE[error.code],
      error.message,
      error.details,
    );
  }

  // A Zod error can only reach here if a route validates outside `parseInput`.
  if (error instanceof ZodError) {
    return errorResponse(400, "Validation failed", zodFieldErrors(error));
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation → the resource already exists.
    if (error.code === "P2002") {
      return errorResponse(409, "Resource already exists");
    }
    // Record required by the operation was not found (e.g. update/delete).
    if (error.code === "P2025") {
      return errorResponse(404, "Not Found");
    }
  }

  // Unknown / unexpected: log the real error, expose nothing.
  console.error("Unhandled API error:", error);
  return errorResponse(500, "Internal Server Error");
}

/**
 * Wrap a route handler so any thrown value becomes the deterministic error
 * contract. Works for both `(request)` and `(request, { params })` signatures.
 */
export function withApiErrors<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>,
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (error) {
      return apiErrorResponse(error);
    }
  };
}

/**
 * Parse a JSON request body, mapping malformed JSON to a 400 (not a 500).
 * Returns `any` — like the platform's own `Request.json()` — because the body
 * is untrusted external input that each service re-validates via `parseInput`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readJson(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    throw new ServiceError("Invalid JSON body", "VALIDATION");
  }
}

/**
 * Assert a service returned an existing record. Services stay transport-agnostic
 * (returning `null` / `false` for "not found"); routes call this so every 404
 * flows through the centralized handler instead of being hand-written.
 */
export function assertFound<T>(
  value: T | null | undefined | false,
  message = "Not Found",
): T {
  if (value === null || value === undefined || value === false) {
    throw new ServiceError(message, "NOT_FOUND");
  }
  return value;
}

/** `{ success: true, data }` with an optional status (defaults to 200). */
export function ok<T>(data: T, status = 200): Response {
  const body: ApiSuccessResponse<T> = { success: true, data };
  return Response.json(body, { status });
}

/** `{ success: true, data }` with a 201 Created status. */
export function created<T>(data: T): Response {
  return ok(data, 201);
}

/** `{ success: true, data, pagination }` for list endpoints. */
export function okPaginated<T>(result: PaginatedResult<T>): Response {
  const body: ApiSuccessResponse<T[]> = {
    success: true,
    data: result.data,
    pagination: result.pagination,
  };
  return Response.json(body);
}

/** Empty 204 response for successful deletes. */
export function noContent(): Response {
  return new Response(null, { status: 204 });
}
