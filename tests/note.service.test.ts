import { createLabel } from '@/features/labels/label.service';
import { getEntryLabelIds } from '@/features/labels/label.repository';
import { createNote, saveNoteBody, updateNote } from '@/features/notes/note.service';
import { getNoteWithBody } from '@/features/notes/note.repository';

import { createTestDb } from './helpers/test-db';

describe('createNote', () => {
  it('sanitizes the raw editor HTML before persisting it', () => {
    const db = createTestDb();

    const id = createNote(
      { title: 'Recipe', bodyHtml: '<p onclick="x()">Safe</p><script>alert(1)</script>' },
      db,
    );

    const note = getNoteWithBody(id, db)!;
    expect(note.bodyHtml).toBe('<p>Safe</p>');
  });

  it('derives body_plain_text from the sanitized HTML, not the raw input', () => {
    const db = createTestDb();

    const id = createNote(
      { title: 'Recipe', bodyHtml: '<h2>Title</h2><p>Body <script>alert(1)</script>text</p>' },
      db,
    );

    const note = getNoteWithBody(id, db)!;
    expect(note.bodyPlainText).toBe('Title Body text');
  });

  it('applies an initial label selection in the same transaction as the note itself', () => {
    const db = createTestDb();
    const dinner = createLabel('Dinner', db);
    const pasta = createLabel('Pasta', db);

    const id = createNote(
      { title: 'Recipe', bodyHtml: '<p>ok</p>', labelIds: [dinner, pasta] },
      db,
    );

    expect(new Set(getEntryLabelIds(id, db))).toEqual(new Set([dinner, pasta]));
  });
});

describe('saveNoteBody', () => {
  it('sanitizes and re-derives body_plain_text on every save, bumping updatedAt', () => {
    const db = createTestDb();
    const id = createNote({ title: 'Recipe', bodyHtml: '<p>original</p>' }, db);
    const originalUpdatedAt = getNoteWithBody(id, db)!.updatedAt.getTime();

    saveNoteBody(id, '<p>updated</p><img src="x" onerror="alert(1)">', db);

    const note = getNoteWithBody(id, db)!;
    expect(note.bodyHtml).toBe('<p>updated</p>');
    expect(note.bodyPlainText).toBe('updated');
    expect(note.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
  });
});

describe('updateNote', () => {
  it('updates title and sanitized body together in one transaction', () => {
    const db = createTestDb();
    const id = createNote({ title: 'Original', bodyHtml: '<p>original</p>' }, db);

    updateNote(id, { title: 'Renamed', bodyHtml: '<p>updated</p><script>alert(1)</script>' }, db);

    const note = getNoteWithBody(id, db)!;
    expect(note.title).toBe('Renamed');
    expect(note.bodyHtml).toBe('<p>updated</p>');
    expect(note.bodyPlainText).toBe('updated');
  });

  it('replaces label associations when labelIds is given', () => {
    const db = createTestDb();
    const dinner = createLabel('Dinner', db);
    const pasta = createLabel('Pasta', db);
    const dessert = createLabel('Dessert', db);
    const id = createNote(
      { title: 'Recipe', bodyHtml: '<p>ok</p>', labelIds: [dinner, pasta] },
      db,
    );

    updateNote(id, { title: 'Recipe', bodyHtml: '<p>ok</p>', labelIds: [pasta, dessert] }, db);

    expect(new Set(getEntryLabelIds(id, db))).toEqual(new Set([pasta, dessert]));
  });

  it('leaves existing label associations untouched when labelIds is omitted', () => {
    const db = createTestDb();
    const dinner = createLabel('Dinner', db);
    const id = createNote({ title: 'Recipe', bodyHtml: '<p>ok</p>', labelIds: [dinner] }, db);

    updateNote(id, { title: 'Renamed', bodyHtml: '<p>ok</p>' }, db);

    expect(getEntryLabelIds(id, db)).toEqual([dinner]);
  });
});
