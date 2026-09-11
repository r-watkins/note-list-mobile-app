import { db, type DbClient } from '@/db/client';
import { applyEntryLabelDiff } from '@/features/labels/label.service';
import {
  insertNoteEntry,
  updateNoteBody,
  updateNoteEntryTitle,
} from '@/features/notes/note.repository';
import { deriveNotePlainText, sanitizeNoteHtml } from '@/lib/html/sanitize';
import { generateId } from '@/lib/id';

export type CreateNoteInput = { title: string; bodyHtml: string; labelIds?: string[] };

/**
 * Creates a note entry, sanitizing the editor's raw HTML (Task 16's allowlist) and deriving
 * `body_plain_text` from the sanitized result before persisting either - never the raw editor
 * output. Applies the initial label selection (Task 45) in the same transaction, so a note
 * and its labels are never observably created apart. Returns the new entry's id.
 */
export function createNote(input: CreateNoteInput, executor: DbClient = db): string {
  const id = generateId();
  const now = new Date();
  const bodyHtml = sanitizeNoteHtml(input.bodyHtml);
  const bodyPlainText = deriveNotePlainText(bodyHtml);

  executor.transaction((tx) => {
    insertNoteEntry({ id, title: input.title, bodyHtml, bodyPlainText, now }, tx);
    if (input.labelIds && input.labelIds.length > 0) {
      applyEntryLabelDiff(id, input.labelIds, now, tx);
    }
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

export type UpdateNoteInput = { title: string; bodyHtml: string; labelIds?: string[] };

/**
 * Saves the edit screen's single Save action: title, body, and labels together, in one
 * transaction with one `updatedAt`. `labelIds` is optional and, when given, replaces the
 * note's full label set (undefined leaves existing associations untouched, for any future
 * caller that only wants to change title/body).
 */
export function updateNote(entryId: string, input: UpdateNoteInput, executor: DbClient = db): void {
  const now = new Date();
  const bodyHtml = sanitizeNoteHtml(input.bodyHtml);
  const bodyPlainText = deriveNotePlainText(bodyHtml);

  executor.transaction((tx) => {
    updateNoteEntryTitle(entryId, input.title, now, tx);
    updateNoteBody(entryId, { bodyHtml, bodyPlainText }, now, tx);
    if (input.labelIds !== undefined) {
      applyEntryLabelDiff(entryId, input.labelIds, now, tx);
    }
  });
}
