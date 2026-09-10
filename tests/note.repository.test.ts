import { eq } from 'drizzle-orm';

import { generateId } from '@/lib/id';
import {
  deleteNoteEntry,
  getNoteWithBody,
  insertNoteEntry,
  updateNoteBody,
  updateNoteEntryTitle,
} from '@/features/notes/note.repository';
import { entryLabels, labels } from '@/db/schema';

import { createTestDb } from './helpers/test-db';

function insertNote(
  db: ReturnType<typeof createTestDb>,
  overrides: Partial<{
    title: string;
    bodyHtml: string;
    bodyPlainText: string;
    now: Date;
  }> = {},
) {
  const id = generateId();
  insertNoteEntry(
    {
      id,
      title: overrides.title ?? 'Weeknight Turkey Pasta',
      bodyHtml: overrides.bodyHtml ?? '<p>Boil pasta.</p>',
      bodyPlainText: overrides.bodyPlainText ?? 'Boil pasta.',
      now: overrides.now ?? new Date(),
    },
    db,
  );
  return id;
}

describe('insertNoteEntry / getNoteWithBody', () => {
  it('persists a note entry and its body, readable as one flattened object', () => {
    const db = createTestDb();
    const id = insertNote(db, {
      title: 'Weeknight Turkey Pasta',
      bodyHtml: '<p>Boil pasta.</p>',
      bodyPlainText: 'Boil pasta.',
    });

    const note = getNoteWithBody(id, db);

    expect(note).toBeDefined();
    expect(note!.id).toBe(id);
    expect(note!.entryType).toBe('note');
    expect(note!.title).toBe('Weeknight Turkey Pasta');
    expect(note!.bodyHtml).toBe('<p>Boil pasta.</p>');
    expect(note!.bodyPlainText).toBe('Boil pasta.');
  });

  it('returns undefined for a nonexistent id', () => {
    const db = createTestDb();
    expect(getNoteWithBody('missing', db)).toBeUndefined();
  });
});

describe('updateNoteEntryTitle', () => {
  it('updates the title and bumps updatedAt', () => {
    const db = createTestDb();
    const originalNow = new Date(1000);
    const id = insertNote(db, { now: originalNow });
    const later = new Date(2000);

    updateNoteEntryTitle(id, 'Renamed Note', later, db);

    const note = getNoteWithBody(id, db)!;
    expect(note.title).toBe('Renamed Note');
    expect(note.updatedAt.getTime()).toBe(later.getTime());
  });
});

describe('updateNoteBody', () => {
  it('updates bodyHtml/bodyPlainText and bumps updatedAt', () => {
    const db = createTestDb();
    const originalNow = new Date(1000);
    const id = insertNote(db, { now: originalNow });
    const later = new Date(2000);

    updateNoteBody(id, { bodyHtml: '<p>Updated.</p>', bodyPlainText: 'Updated.' }, later, db);

    const note = getNoteWithBody(id, db)!;
    expect(note.bodyHtml).toBe('<p>Updated.</p>');
    expect(note.bodyPlainText).toBe('Updated.');
    expect(note.updatedAt.getTime()).toBe(later.getTime());
  });
});

describe('deleteNoteEntry', () => {
  it('cascades to remove the notes row and any entry_labels associations', () => {
    const db = createTestDb();
    const id = insertNote(db);
    db.insert(labels)
      .values({
        id: 'lb1',
        name: 'Dinner',
        normalizedName: 'dinner',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();
    db.insert(entryLabels).values({ entryId: id, labelId: 'lb1', createdAt: new Date() }).run();

    deleteNoteEntry(id, db);

    expect(getNoteWithBody(id, db)).toBeUndefined();
    expect(db.select().from(entryLabels).where(eq(entryLabels.entryId, id)).all().length).toBe(0);
  });
});
