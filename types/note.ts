import { BaseEntity, EntityType, ID, type WithIsoDates } from "./common";

export interface Note extends BaseEntity {
  entityType: EntityType;
  entityId: ID;

  content: string;
  createdBy: ID;

  /** Optional until Milestone 5/6 thread org scoping through the service layer. */
  organizationId?: ID;
}

/** Note as returned by API JSON (dates are ISO strings). */
export type NoteDto = WithIsoDates<Note>;
