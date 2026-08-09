import { BaseEntity, EntityType, ID, type WithIsoDates } from "./common";
import type { ActivityType } from "@/lib/schemas/enums";

// Source of truth: lib/schemas/enums.ts.
// Notes are a separate entity; add "note_created" there later if the timeline should surface them.
export type { ActivityType };

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

