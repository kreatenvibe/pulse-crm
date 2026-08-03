export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
};

function getErrorMessage(status: number, body: unknown, statusText: string): string {
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error: unknown }).error;
    if (typeof error === "string" && error.trim()) return error;
  }

  if (typeof body === "string" && body.trim()) return body;

  return statusText || `Request failed with status ${status}`;
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
    throw new ApiError(
      response.status,
      getErrorMessage(response.status, data, response.statusText),
      data,
    );
  }

  return data as T;
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
