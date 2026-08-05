// types/common.ts

export type ID = string;

export interface BaseEntity {
  id: ID;
  createdAt: Date;
  updatedAt: Date;
}

export type EntityType =
  | "lead"
  | "customer"
  | "appointment"
  | "task"
  | "service"
  | "invoice"
  | "note";

/** JSON/API wire format: Date fields become ISO strings. */
export type IsoDateString = string;

export type WithIsoDates<T> = {
  [K in keyof T]: T[K] extends Date | undefined
    ? Exclude<T[K], Date> | IsoDateString
    : T[K];
};

/** Request params for list endpoints (e.g. `?page=1&pageSize=10`). */
export type PaginationParams = {
  page: number;
  pageSize: number;
};

/** Metadata returned with paginated list responses. */
export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

/** Standard paginated list envelope for API/service responses. */
export type PaginatedResult<T> = {
  data: T[];
  pagination: PaginationMeta;
};
