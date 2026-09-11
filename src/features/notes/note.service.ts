import { db, type DbClient } from '@/db/client';
import {
  insertNoteEntry,
  updateNoteBody,
  updateNoteEntryTitle,
} from '@/features/notes/note.repository';
import { deriveNotePlainText, sanitizeNoteHtml } from '@/lib/html/sanitize';
import { generateId } from '@/lib/id';

export type CreateNoteInput = { title: string; bodyHtml: string };

/**
 * Creates a note entry, sanitizing the editor's raw HTML (Task 16's allowlist) and deriving
 * `body_plain_text` from the sanitized result before persisting either - never the raw editor
 * output. Returns the new entry's id.
 */
export function createNote(input: CreateNoteInput, executor: DbClient = db): string {
  const id = generateId();
  const now = new Date();
  const bodyHtml = sanitizeNoteHtml(input.bodyHtml);
  const bodyPlainText = deriveNotePlainText(bodyHtml);

  executor.transaction((tx) => {
    insertNoteEntry({ id, title: input.title, bodyHtml, bodyPlainText, now }, tx);
  });

  return id;
}

/**
 * Sanitizes and persists a note's rich-text body on save, deriving `body_plain_text` from the
 * sanitized HTML (same rule as createNote - the plain-text projection must never be derived
 * from unsanitized input).
 */
export function saveNoteBody(entryId: string, rawHtml: string, executor: DbClient = db): void {
  const now = new Date();
  const bodyHtml = sanitizeNoteHtml(rawHtml);
  const bodyPlainText = deriveNotePlainText(bodyHtml);

  executor.transaction((tx) => {
    updateNoteBody(entryId, { bodyHtml, bodyPlainText }, now, tx);
  });
}

export type UpdateNoteInput = { title: string; bodyHtml: string };

/**
 * Saves the edit screen's single Save action: title and body together, in one transaction
 * with one `updatedAt`, so they never appear to have updated at slightly different times.
 */
export function updateNote(entryId: string, input: UpdateNoteInput, executor: DbClient = db): void {
  const now = new Date();
  const bodyHtml = sanitizeNoteHtml(input.bodyHtml);
  const bodyPlainText = deriveNotePlainText(bodyHtml);

  executor.transaction((tx) => {
    updateNoteEntryTitle(entryId, input.title, now, tx);
    updateNoteBody(entryId, { bodyHtml, bodyPlainText }, now, tx);
  });
}
