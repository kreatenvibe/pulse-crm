import type {
  ApiErrorDetails,
  ApiErrorPayload,
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/types/api";

export type { ApiErrorDetails };

export class ApiError extends Error {
  readonly status: number;
  readonly details?: ApiErrorDetails;
  readonly body: unknown;

  constructor(
    status: number,
    message: string,
    details?: ApiErrorDetails,
    body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.body = body;
  }
}

type RequestOptions = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
};

/**
 * Deterministic error envelope: { success: false, error: { message, details? } }.
 * Falls back gracefully if the body predates the envelope or isn't JSON.
 */
function parseErrorBody(
  status: number,
  body: unknown,
  statusText: string,
): ApiErrorPayload {
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as ApiErrorResponse).error as unknown;
    if (error && typeof error === "object") {
      const { message, details } = error as {
        message?: unknown;
        details?: unknown;
      };
      return {
        message:
          typeof message === "string" && message.trim()
            ? message
            : statusText || `Request failed with status ${status}`,
        details: details as ApiErrorDetails | undefined,
      };
    }
    // Legacy shape: { error: "message" }.
    if (typeof error === "string" && error.trim()) return { message: error };
  }

  if (typeof body === "string" && body.trim()) return { message: body };

  return { message: statusText || `Request failed with status ${status}` };
}

/**
 * Deterministic success envelope: { success: true, data, pagination? }.
 * Returns `{ data, pagination }` when paginated so `PaginatedResult` consumers
 * keep working, otherwise the unwrapped `data`. Non-enveloped bodies (e.g. 204)
 * pass through unchanged.
 */
function unwrapSuccess(body: unknown): unknown {
  if (body && typeof body === "object" && "success" in body) {
    const envelope = body as ApiSuccessResponse<unknown>;
    if (envelope.success === true) {
      if ("pagination" in envelope) {
        return { data: envelope.data, pagination: envelope.pagination };
      }
      return envelope.data;
    }
  }
  return body;
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(
      response.status,
      "Invalid JSON response from server",
      undefined,
      text,
    );
  }
}

async function request<T>({ method, path, body }: RequestOptions): Promise<T> {
  const response = await fetch(path, {
    method,
    headers:
      body === undefined
        ? undefined
        : {
            "Content-Type": "application/json",
          },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const { message, details } = parseErrorBody(
      response.status,
      data,
      response.statusText,
    );
    throw new ApiError(response.status, message, details, data);
  }

  return unwrapSuccess(data) as T;
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>({ method: "GET", path });
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>({ method: "POST", path, body });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>({ method: "PATCH", path, body });
  },

  delete<T>(path: string): Promise<T> {
    return request<T>({ method: "DELETE", path });
  },
};

/** Shared, single-source error-message extraction for hooks and forms. */
export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Field-level validation details from an `ApiError`, if the server sent any. */
export function getErrorDetails(error: unknown): ApiErrorDetails | undefined {
  return error instanceof ApiError ? error.details : undefined;
}
