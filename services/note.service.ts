import { notes } from "@/data/notes";
import type { EntityType, ID } from "@/types/common";
import type { Note } from "@/types/note";
import { nextId, now } from "./helpers";

export type CreateNoteInput = Omit<Note, "id" | "createdAt" | "updatedAt">;
export type UpdateNoteInput = Partial<CreateNoteInput>;

class NoteService {
  async getAll(): Promise<Note[]> {
    return [...notes];
  }

  async getById(id: ID): Promise<Note | null> {
    return notes.find((note) => note.id === id) ?? null;
  }

  async create(data: CreateNoteInput): Promise<Note> {
    const timestamp = now();
    const note: Note = {
      ...data,
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

    const updated: Note = {
      ...notes[index],
      ...data,
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
