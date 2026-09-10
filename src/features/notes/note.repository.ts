import { and, eq } from 'drizzle-orm';

import { db, type DbClient } from '@/db/client';
import { entries, notes } from '@/db/schema';

export type NoteEntryRow = typeof entries.$inferSelect;
export type NoteRow = typeof notes.$inferSelect;

export type NoteWithBody = NoteEntryRow & { bodyHtml: string; bodyPlainText: string };

export type InsertNoteEntryInput = {
  id: string;
  title: string;
  bodyHtml: string;
  bodyPlainText: string;
  now: Date;
};

/** Inserts the `entries` row and its `notes` row for a new note. */
export function insertNoteEntry(input: InsertNoteEntryInput, executor: DbClient = db): void {
  executor
    .insert(entries)
    .values({
      id: input.id,
      entryType: 'note',
      title: input.title,
      createdAt: input.now,
      updatedAt: input.now,
    })
    .run();
  executor
    .insert(notes)
    .values({
      entryId: input.id,
      bodyHtml: input.bodyHtml,
      bodyPlainText: input.bodyPlainText,
    })
    .run();
}

/** Reads a note entry with its body, or undefined if it doesn't exist or isn't a note. */
export function getNoteWithBody(
  entryId: string,
  executor: DbClient = db,
): NoteWithBody | undefined {
  const entry = executor
    .select()
    .from(entries)
    .where(and(eq(entries.id, entryId), eq(entries.entryType, 'note')))
    .get();
  if (!entry) {
    return undefined;
  }

  const note = executor.select().from(notes).where(eq(notes.entryId, entryId)).get();
  if (!note) {
    return undefined;
  }

  return { ...entry, bodyHtml: note.bodyHtml, bodyPlainText: note.bodyPlainText };
}

export function updateNoteEntryTitle(
  entryId: string,
  title: string,
  now: Date,
  executor: DbClient = db,
): void {
  executor.update(entries).set({ title, updatedAt: now }).where(eq(entries.id, entryId)).run();
}

export type NoteBodyChanges = { bodyHtml: string; bodyPlainText: string };

/**
 * Updates a note's rich-text body and bumps the entry's updatedAt. Sanitizing the HTML
 * and deriving bodyPlainText from it is Task 40's job - this just persists whatever
 * it's given, same division of responsibility as list.repository.ts's item/sublist
 * mutations versus list.service.ts's transaction orchestration.
 */
export function updateNoteBody(
  entryId: string,
  changes: NoteBodyChanges,
  now: Date,
  executor: DbClient = db,
): void {
  executor.update(notes).set(changes).where(eq(notes.entryId, entryId)).run();
  executor.update(entries).set({ updatedAt: now }).where(eq(entries.id, entryId)).run();
}

/** Deletes the note's `entries` row; `onDelete: 'cascade'` removes its `notes`/`entry_labels` rows. */
export function deleteNoteEntry(entryId: string, executor: DbClient = db): void {
  executor.delete(entries).where(eq(entries.id, entryId)).run();
}
