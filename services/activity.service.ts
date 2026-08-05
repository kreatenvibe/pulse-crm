import { activities } from "@/data/activities";
import type { EntityType, ID } from "@/types/common";
import type { Activity, ActivityType } from "@/types/activity";
import { nextId, now } from "./helpers";
import {
  assertEntityReference,
  assertEnum,
  assertRequiredString,
  assertUserId,
  toDate,
} from "./validation";

export type CreateActivityInput = Omit<
  Activity,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateActivityInput = Partial<CreateActivityInput>;

const ACTIVITY_TYPES: ActivityType[] = [
  "call",
  "email",
  "whatsapp",
  "meeting",
  "status_change",
  "created",
  "updated",
  "assigned",
];

const ENTITY_TYPES: EntityType[] = [
  "lead",
  "customer",
  "appointment",
  "task",
  "service",
  "invoice",
  "note",
];

function validateCreateInput(data: CreateActivityInput): CreateActivityInput {
  const entityType = assertEnum(data.entityType, ENTITY_TYPES, "entityType");
  const entityId = assertRequiredString(data.entityId, "entityId");
  assertEntityReference(entityType, entityId);

  return {
    entityType,
    entityId,
    type: assertEnum(data.type, ACTIVITY_TYPES, "type"),
    description: assertRequiredString(data.description, "description"),
    performedBy: assertUserId(data.performedBy, "performedBy"),
    timestamp: toDate(data.timestamp, "timestamp"),
  };
}

function validateUpdateInput(data: UpdateActivityInput): UpdateActivityInput {
  const validated: UpdateActivityInput = {};

  if ("entityType" in data && data.entityType !== undefined) {
    validated.entityType = assertEnum(data.entityType, ENTITY_TYPES, "entityType");
  }
  if ("entityId" in data && data.entityId !== undefined) {
    validated.entityId = assertRequiredString(data.entityId, "entityId");
  }
  if (validated.entityType && validated.entityId) {
    assertEntityReference(validated.entityType, validated.entityId);
  }
  if ("type" in data && data.type !== undefined) {
    validated.type = assertEnum(data.type, ACTIVITY_TYPES, "type");
  }
  if ("description" in data && data.description !== undefined) {
    validated.description = assertRequiredString(
      data.description,
      "description",
    );
  }
  if ("performedBy" in data && data.performedBy !== undefined) {
    validated.performedBy = assertUserId(data.performedBy, "performedBy");
  }
  if ("timestamp" in data && data.timestamp !== undefined) {
    validated.timestamp = toDate(data.timestamp, "timestamp");
  }

  return validated;
}

class ActivityService {
  async getAll(): Promise<Activity[]> {
    return [...activities];
  }

  async getById(id: ID): Promise<Activity | null> {
    return activities.find((activity) => activity.id === id) ?? null;
  }

  async create(data: CreateActivityInput): Promise<Activity> {
    const validated = validateCreateInput(data);
    const timestamp = now();
    const activity: Activity = {
      ...validated,
      id: nextId("act", activities),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    activities.push(activity);
    return activity;
  }

  async update(id: ID, data: UpdateActivityInput): Promise<Activity | null> {
    const index = activities.findIndex((activity) => activity.id === id);
    if (index === -1) return null;

    const validated = validateUpdateInput(data);
    const updated: Activity = {
      ...activities[index],
      ...validated,
      id,
      updatedAt: now(),
    };
    activities[index] = updated;
    return updated;
  }

  async delete(id: ID): Promise<boolean> {
    const index = activities.findIndex((activity) => activity.id === id);
    if (index === -1) return false;
    activities.splice(index, 1);
    return true;
  }

  async getByType(type: ActivityType): Promise<Activity[]> {
    return activities.filter((activity) => activity.type === type);
  }

  async getByPerformer(userId: ID): Promise<Activity[]> {
    return activities.filter((activity) => activity.performedBy === userId);
  }

  /** Timeline for one entity, newest first. */
  async getTimeline(
    entityType: EntityType,
    entityId: ID,
  ): Promise<Activity[]> {
    return activities
      .filter(
        (activity) =>
          activity.entityType === entityType && activity.entityId === entityId,
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getRecent(limit = 20): Promise<Activity[]> {
    return [...activities]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const activityService = new ActivityService();
