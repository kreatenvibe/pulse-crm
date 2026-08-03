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
