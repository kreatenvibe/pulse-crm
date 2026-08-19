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
import { parseInput } from "./parse";
import { assertEntityReference, assertUserId } from "./validation";

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
  async getAll(organizationId: ID): Promise<Activity[]> {
    const rows = await prisma.activities.findMany({
      where: { organization_id: organizationId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toActivity);
  }

  async getById(organizationId: ID, id: ID): Promise<Activity | null> {
    const row = await prisma.activities.findFirst({
      where: { id, organization_id: organizationId },
    });
    return row ? toActivity(row) : null;
  }

  async create(organizationId: ID, data: CreateActivityInput): Promise<Activity> {
    const input = parseInput(CreateActivitySchema, data);
    await assertEntityReference(organizationId, input.entityType, input.entityId);
    const performedBy = await assertUserId(organizationId, input.performedBy, "performedBy");
    const timestamp = now();

    // Deliberately NOT filtered by organizationId — `id` is a global primary
    // key (see lead.service.ts's `create` for the full rationale).
    const existing = await prisma.activities.findMany({ select: { id: true } });
    const id = nextId("act", existing);

    const row = await prisma.activities.create({
      data: {
        id,
        organization_id: organizationId,
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

  async update(organizationId: ID, id: ID, data: UpdateActivityInput): Promise<Activity | null> {
    const previous = await this.getById(organizationId, id);
    if (!previous) return null;

    const validated = parseInput(UpdateActivitySchema, data);
    if (validated.entityType !== undefined && validated.entityId !== undefined) {
      await assertEntityReference(organizationId, validated.entityType, validated.entityId);
    }
    if (validated.performedBy !== undefined) {
      validated.performedBy = await assertUserId(
        organizationId,
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

  async delete(organizationId: ID, id: ID): Promise<boolean> {
    const existing = await prisma.activities.findFirst({
      where: { id, organization_id: organizationId },
      select: { id: true },
    });
    if (!existing) return false;

    await prisma.activities.delete({ where: { id } });
    return true;
  }

  async getByType(organizationId: ID, type: ActivityType): Promise<Activity[]> {
    const rows = await prisma.activities.findMany({
      where: { organization_id: organizationId, type },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toActivity);
  }

  async getByPerformer(organizationId: ID, userId: ID): Promise<Activity[]> {
    const rows = await prisma.activities.findMany({
      where: { organization_id: organizationId, performed_by: userId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toActivity);
  }

  /** Timeline for one entity, newest first. */
  async getTimeline(
    organizationId: ID,
    entityType: EntityType,
    entityId: ID,
  ): Promise<Activity[]> {
    const rows = await prisma.activities.findMany({
      where: { organization_id: organizationId, entity_type: entityType, entity_id: entityId },
      orderBy: { occurred_at: "desc" },
    });
    return rows.map(toActivity);
  }

  async getRecent(organizationId: ID, limit = 20): Promise<Activity[]> {
    const rows = await prisma.activities.findMany({
      where: { organization_id: organizationId },
      orderBy: { occurred_at: "desc" },
      take: limit,
    });
    return rows.map(toActivity);
  }
}

export const activityService = new ActivityService();
