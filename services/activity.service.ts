import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { activities as ActivityRow } from "@/lib/generated/prisma/client";
import type { EntityType, ID } from "@/types/common";
import type { Activity, ActivityType } from "@/types/activity";
import {
  CreateActivitySchema,
  UpdateActivitySchema,
  type CreateActivityInput,
  type UpdateActivityInput,
} from "@/lib/schemas/activity.schema";
import { nextId, now } from "./helpers";
import {
  assertEntityReference,
  assertUserId,
  parseInput,
} from "./validation";

export type { CreateActivityInput, UpdateActivityInput };

/** Stable order: zero-padded ids sort identically to the original /data array. */
const ORDER_BY_ID = { id: "asc" } as const;

/** Map a Prisma `activities` row (snake_case, nullable) to the domain `Activity`. */
function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    entityType: row.entity_type as EntityType,
    entityId: row.entity_id,
    type: row.type as ActivityType,
    description: row.description,
    performedBy: row.performed_by,
    timestamp: row.occurred_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Translate a validated partial update into a Prisma column patch. */
function toUpdatePatch(
  validated: UpdateActivityInput,
): Prisma.activitiesUncheckedUpdateInput {
  const patch: Prisma.activitiesUncheckedUpdateInput = { updated_at: now() };

  if ("entityType" in validated) patch.entity_type = validated.entityType;
  if ("entityId" in validated) patch.entity_id = validated.entityId;
  if ("type" in validated) patch.type = validated.type;
  if ("description" in validated) patch.description = validated.description;
  if ("performedBy" in validated) patch.performed_by = validated.performedBy;
  if ("timestamp" in validated) patch.occurred_at = validated.timestamp;

  return patch;
}

class ActivityService {
  async getAll(): Promise<Activity[]> {
    const rows = await prisma.activities.findMany({ orderBy: ORDER_BY_ID });
    return rows.map(toActivity);
  }

  async getById(id: ID): Promise<Activity | null> {
    const row = await prisma.activities.findUnique({ where: { id } });
    return row ? toActivity(row) : null;
  }

  async create(data: CreateActivityInput): Promise<Activity> {
    const input = parseInput(CreateActivitySchema, data);
    await assertEntityReference(input.entityType, input.entityId);
    const performedBy = await assertUserId(input.performedBy, "performedBy");
    const timestamp = now();

    const existing = await prisma.activities.findMany({ select: { id: true } });
    const id = nextId("act", existing);

    const row = await prisma.activities.create({
      data: {
        id,
        entity_type: input.entityType,
        entity_id: input.entityId,
        type: input.type,
        description: input.description,
        performed_by: performedBy,
        occurred_at: input.timestamp,
        created_at: timestamp,
        updated_at: timestamp,
      },
    });

    return toActivity(row);
  }

  async update(id: ID, data: UpdateActivityInput): Promise<Activity | null> {
    const previous = await this.getById(id);
    if (!previous) return null;

    const validated = parseInput(UpdateActivitySchema, data);
    if (validated.entityType !== undefined && validated.entityId !== undefined) {
      await assertEntityReference(validated.entityType, validated.entityId);
    }
    if (validated.performedBy !== undefined) {
      validated.performedBy = await assertUserId(
        validated.performedBy,
        "performedBy",
      );
    }
    const row = await prisma.activities.update({
      where: { id },
      data: toUpdatePatch(validated),
    });

    return toActivity(row);
  }

  async delete(id: ID): Promise<boolean> {
    const existing = await prisma.activities.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return false;

    await prisma.activities.delete({ where: { id } });
    return true;
  }

  async getByType(type: ActivityType): Promise<Activity[]> {
    const rows = await prisma.activities.findMany({
      where: { type },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toActivity);
  }

  async getByPerformer(userId: ID): Promise<Activity[]> {
    const rows = await prisma.activities.findMany({
      where: { performed_by: userId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toActivity);
  }

  /** Timeline for one entity, newest first. */
  async getTimeline(
    entityType: EntityType,
    entityId: ID,
  ): Promise<Activity[]> {
    const rows = await prisma.activities.findMany({
      where: { entity_type: entityType, entity_id: entityId },
      orderBy: { occurred_at: "desc" },
    });
    return rows.map(toActivity);
  }

  async getRecent(limit = 20): Promise<Activity[]> {
    const rows = await prisma.activities.findMany({
      orderBy: { occurred_at: "desc" },
      take: limit,
    });
    return rows.map(toActivity);
  }
}

export const activityService = new ActivityService();
