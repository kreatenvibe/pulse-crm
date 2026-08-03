import { BaseEntity, EntityType, ID, type WithIsoDates } from "./common";

// Notes are a separate entity; add "note_created" here later if the timeline should surface them.
export type ActivityType =
  | "call"
  | "email"
  | "whatsapp"
  | "meeting"
  | "status_change"
  | "created"
  | "updated"
  | "assigned";

export interface Activity extends BaseEntity {
  entityType: EntityType;
  entityId: ID;

  type: ActivityType;
  description: string;

  performedBy: ID;
  timestamp: Date;
}

/** Activity as returned by API JSON (dates are ISO strings). */
export type ActivityDto = WithIsoDates<Activity>;

