import { activities } from "@/data/activities";
import type { EntityType, ID } from "@/types/common";
import type { Activity, ActivityType } from "@/types/activity";
import { nextId, now } from "./helpers";

export type CreateActivityInput = Omit<
  Activity,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateActivityInput = Partial<CreateActivityInput>;

class ActivityService {
  async getAll(): Promise<Activity[]> {
    return [...activities];
  }

  async getById(id: ID): Promise<Activity | null> {
    return activities.find((activity) => activity.id === id) ?? null;
  }

  async create(data: CreateActivityInput): Promise<Activity> {
    const timestamp = now();
    const activity: Activity = {
      ...data,
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

    const updated: Activity = {
      ...activities[index],
      ...data,
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
