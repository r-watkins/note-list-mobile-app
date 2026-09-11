import { createNote, saveNoteBody } from '@/features/notes/note.service';
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
