import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { notes as NoteRow } from "@/lib/generated/prisma/client";
import type { EntityType, ID } from "@/types/common";
import type { Note } from "@/types/note";
import {
  CreateNoteSchema,
  UpdateNoteSchema,
  type CreateNoteInput,
  type UpdateNoteInput,
} from "@/lib/schemas/note.schema";
import { nextId, now } from "./helpers";
import { parseInput } from "./parse";
import { assertEntityReference, assertUserId } from "./validation";

export type { CreateNoteInput, UpdateNoteInput };

/** Stable order: zero-padded ids sort identically to the original /data array. */
const ORDER_BY_ID = { id: "asc" } as const;

/** Map a Prisma `notes` row (snake_case, nullable) to the domain `Note`. */
function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    entityType: row.entity_type as EntityType,
    entityId: row.entity_id,
    content: row.content,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Translate a validated partial update into a Prisma column patch. */
function toUpdatePatch(validated: UpdateNoteInput): Prisma.notesUncheckedUpdateInput {
  const patch: Prisma.notesUncheckedUpdateInput = { updated_at: now() };

  if ("entityType" in validated) patch.entity_type = validated.entityType;
  if ("entityId" in validated) patch.entity_id = validated.entityId;
  if ("content" in validated) patch.content = validated.content;
  if ("createdBy" in validated) patch.created_by = validated.createdBy;

  return patch;
}

class NoteService {
  async getAll(organizationId: ID): Promise<Note[]> {
    const rows = await prisma.notes.findMany({
      where: { organization_id: organizationId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toNote);
  }

  async getById(organizationId: ID, id: ID): Promise<Note | null> {
    const row = await prisma.notes.findFirst({
      where: { id, organization_id: organizationId },
    });
    return row ? toNote(row) : null;
  }

  async create(organizationId: ID, data: CreateNoteInput): Promise<Note> {
    const input = parseInput(CreateNoteSchema, data);
    await assertEntityReference(organizationId, input.entityType, input.entityId);
    const createdBy = await assertUserId(organizationId, input.createdBy, "createdBy");
    const timestamp = now();

    // Deliberately NOT filtered by organizationId — `id` is a global primary
    // key (see lead.service.ts's `create` for the full rationale).
    const existing = await prisma.notes.findMany({ select: { id: true } });
    const id = nextId("note", existing);

    const row = await prisma.notes.create({
      data: {
        id,
        organization_id: organizationId,
        entity_type: input.entityType,
        entity_id: input.entityId,
        content: input.content,
        created_by: createdBy,
        created_at: timestamp,
        updated_at: timestamp,
      },
    });

    return toNote(row);
  }

  async update(organizationId: ID, id: ID, data: UpdateNoteInput): Promise<Note | null> {
    const previous = await this.getById(organizationId, id);
    if (!previous) return null;

    const validated = parseInput(UpdateNoteSchema, data);
    if (validated.entityType !== undefined && validated.entityId !== undefined) {
      await assertEntityReference(organizationId, validated.entityType, validated.entityId);
    }
    if (validated.createdBy !== undefined) {
      validated.createdBy = await assertUserId(organizationId, validated.createdBy, "createdBy");
    }
    const row = await prisma.notes.update({
      where: { id },
      data: toUpdatePatch(validated),
    });

    return toNote(row);
  }

  async delete(organizationId: ID, id: ID): Promise<boolean> {
    const existing = await prisma.notes.findFirst({
      where: { id, organization_id: organizationId },
      select: { id: true },
    });
    if (!existing) return false;

    await prisma.notes.delete({ where: { id } });
    return true;
  }

  async getForEntity(organizationId: ID, entityType: EntityType, entityId: ID): Promise<Note[]> {
    const rows = await prisma.notes.findMany({
      where: { organization_id: organizationId, entity_type: entityType, entity_id: entityId },
      orderBy: { created_at: "desc" },
    });
    return rows.map(toNote);
  }

  async getByAuthor(organizationId: ID, userId: ID): Promise<Note[]> {
    const rows = await prisma.notes.findMany({
      where: { organization_id: organizationId, created_by: userId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toNote);
  }
}

export const noteService = new NoteService();
