export type ServiceErrorCode = "VALIDATION" | "NOT_FOUND" | "CONFLICT";

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;

  constructor(message: string, code: ServiceErrorCode) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
  }
}
