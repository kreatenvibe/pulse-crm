import { notes } from "@/data/notes";
import type { EntityType, ID } from "@/types/common";
import type { Note } from "@/types/note";
import { nextId, now } from "./helpers";
import {
  assertEntityReference,
  assertEnum,
  assertRequiredString,
  assertUserId,
} from "./validation";

export type CreateNoteInput = Omit<Note, "id" | "createdAt" | "updatedAt">;
export type UpdateNoteInput = Partial<CreateNoteInput>;

const ENTITY_TYPES: EntityType[] = [
  "lead",
  "customer",
  "appointment",
  "task",
  "service",
  "invoice",
  "note",
];

function validateCreateInput(data: CreateNoteInput): CreateNoteInput {
  const entityType = assertEnum(data.entityType, ENTITY_TYPES, "entityType");
  const entityId = assertRequiredString(data.entityId, "entityId");
  assertEntityReference(entityType, entityId);

  return {
    entityType,
    entityId,
    content: assertRequiredString(data.content, "content"),
    createdBy: assertUserId(data.createdBy, "createdBy"),
  };
}

function validateUpdateInput(data: UpdateNoteInput): UpdateNoteInput {
  const validated: UpdateNoteInput = {};

  if ("entityType" in data && data.entityType !== undefined) {
    validated.entityType = assertEnum(data.entityType, ENTITY_TYPES, "entityType");
  }
  if ("entityId" in data && data.entityId !== undefined) {
    validated.entityId = assertRequiredString(data.entityId, "entityId");
  }
  if (validated.entityType && validated.entityId) {
    assertEntityReference(validated.entityType, validated.entityId);
  }
  if ("content" in data && data.content !== undefined) {
    validated.content = assertRequiredString(data.content, "content");
  }
  if ("createdBy" in data && data.createdBy !== undefined) {
    validated.createdBy = assertUserId(data.createdBy, "createdBy");
  }

  return validated;
}

class NoteService {
  async getAll(): Promise<Note[]> {
    return [...notes];
  }

  async getById(id: ID): Promise<Note | null> {
    return notes.find((note) => note.id === id) ?? null;
  }

  async create(data: CreateNoteInput): Promise<Note> {
    const validated = validateCreateInput(data);
    const timestamp = now();
    const note: Note = {
      ...validated,
      id: nextId("note", notes),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    notes.push(note);
    return note;
  }

  async update(id: ID, data: UpdateNoteInput): Promise<Note | null> {
    const index = notes.findIndex((note) => note.id === id);
    if (index === -1) return null;

    const validated = validateUpdateInput(data);
    const updated: Note = {
      ...notes[index],
      ...validated,
      id,
      updatedAt: now(),
    };
    notes[index] = updated;
    return updated;
  }

  async delete(id: ID): Promise<boolean> {
    const index = notes.findIndex((note) => note.id === id);
    if (index === -1) return false;
    notes.splice(index, 1);
    return true;
  }

  async getForEntity(entityType: EntityType, entityId: ID): Promise<Note[]> {
    return notes
      .filter(
        (note) => note.entityType === entityType && note.entityId === entityId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getByAuthor(userId: ID): Promise<Note[]> {
    return notes.filter((note) => note.createdBy === userId);
  }
}

export const noteService = new NoteService();
