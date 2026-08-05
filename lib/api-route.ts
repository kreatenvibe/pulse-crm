import { ServiceError } from "@/services/errors";

export function serviceErrorResponse(error: unknown): Response {
  if (error instanceof ServiceError) {
    const status =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "CONFLICT"
          ? 409
          : 400;
    return Response.json({ error: error.message }, { status });
  }

  return Response.json({ error: "Bad Request" }, { status: 400 });
}
