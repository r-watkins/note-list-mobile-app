import { entries, entryLabels, labels } from '@/db/schema';
import { getLibraryEntries } from '@/features/library/library.repository';

import { createTestDb } from './helpers/test-db';

function insertEntry(
  db: ReturnType<typeof createTestDb>,
  input: { id: string; entryType: 'list' | 'note'; title: string; updatedAt: Date },
) {
  db.insert(entries)
    .values({
      id: input.id,
      entryType: input.entryType,
      title: input.title,
      createdAt: input.updatedAt,
      updatedAt: input.updatedAt,
    })
    .run();
}

function insertLabel(db: ReturnType<typeof createTestDb>, id: string, name: string) {
  db.insert(labels)
    .values({
      id,
      name,
      normalizedName: name.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .run();
}

function attachLabel(db: ReturnType<typeof createTestDb>, entryId: string, labelId: string) {
  db.insert(entryLabels).values({ entryId, labelId, createdAt: new Date() }).run();
}

describe('getLibraryEntries content-type filter', () => {
  it('returns only lists, only notes, or both depending on contentType', () => {
    const db = createTestDb();
    insertEntry(db, { id: 'l1', entryType: 'list', title: 'List One', updatedAt: new Date(1000) });
    insertEntry(db, { id: 'n1', entryType: 'note', title: 'Note One', updatedAt: new Date(2000) });

    expect(getLibraryEntries({ contentType: 'list' }, 'updated-desc', db).map((e) => e.id)).toEqual(
      ['l1'],
    );
    expect(getLibraryEntries({ contentType: 'note' }, 'updated-desc', db).map((e) => e.id)).toEqual(
      ['n1'],
    );
    expect(
      getLibraryEntries({ contentType: 'all' }, 'updated-desc', db)
        .map((e) => e.id)
        .sort(),
    ).toEqual(['l1', 'n1']);
  });
});

describe('getLibraryEntries label filter', () => {
  it('returns only notes carrying the given label, excluding lists even if contentType is all', () => {
    const db = createTestDb();
    insertEntry(db, { id: 'l1', entryType: 'list', title: 'List One', updatedAt: new Date(1000) });
    insertEntry(db, {
      id: 'n1',
      entryType: 'note',
      title: 'Labeled note',
      updatedAt: new Date(2000),
    });
    insertEntry(db, {
      id: 'n2',
      entryType: 'note',
      title: 'Unlabeled note',
      updatedAt: new Date(3000),
    });
    insertLabel(db, 'lb1', 'Dinner');
    attachLabel(db, 'n1', 'lb1');

    const result = getLibraryEntries({ contentType: 'all', labelId: 'lb1' }, 'updated-desc', db);

    expect(result.map((e) => e.id)).toEqual(['n1']);
  });

  it("includes each returned note entry's attached labels", () => {
    const db = createTestDb();
    insertEntry(db, { id: 'n1', entryType: 'note', title: 'Note', updatedAt: new Date(1000) });
    insertLabel(db, 'lb1', 'Dinner');
    insertLabel(db, 'lb2', 'Pasta');
    attachLabel(db, 'n1', 'lb1');
    attachLabel(db, 'n1', 'lb2');

    const result = getLibraryEntries({ contentType: 'all' }, 'updated-desc', db);

    expect(result[0].labels.map((l) => l.name).sort()).toEqual(['Dinner', 'Pasta']);
  });

  it('returns an empty labels array for entries with no labels', () => {
    const db = createTestDb();
    insertEntry(db, { id: 'l1', entryType: 'list', title: 'List', updatedAt: new Date(1000) });

    const result = getLibraryEntries({ contentType: 'all' }, 'updated-desc', db);

    expect(result[0].labels).toEqual([]);
  });
});

describe('getLibraryEntries sort', () => {
  it('updated-desc orders newest-updated first', () => {
    const db = createTestDb();
    insertEntry(db, { id: 'a', entryType: 'note', title: 'A', updatedAt: new Date(1000) });
    insertEntry(db, { id: 'b', entryType: 'note', title: 'B', updatedAt: new Date(3000) });
    insertEntry(db, { id: 'c', entryType: 'note', title: 'C', updatedAt: new Date(2000) });

    const result = getLibraryEntries({ contentType: 'all' }, 'updated-desc', db);

    expect(result.map((e) => e.id)).toEqual(['b', 'c', 'a']);
  });

  it('title-asc orders alphabetically, case-insensitively', () => {
    const db = createTestDb();
    insertEntry(db, { id: 'a', entryType: 'note', title: 'banana', updatedAt: new Date(1000) });
    insertEntry(db, { id: 'b', entryType: 'note', title: 'Apple', updatedAt: new Date(1000) });
    insertEntry(db, { id: 'c', entryType: 'note', title: 'cherry', updatedAt: new Date(1000) });

    const result = getLibraryEntries({ contentType: 'all' }, 'title-asc', db);

    expect(result.map((e) => e.id)).toEqual(['b', 'a', 'c']);
  });

  it('content-type groups lists and notes, newest-updated first within each group', () => {
    const db = createTestDb();
    insertEntry(db, {
      id: 'n-old',
      entryType: 'note',
      title: 'Old note',
      updatedAt: new Date(1000),
    });
    insertEntry(db, {
      id: 'l-new',
      entryType: 'list',
      title: 'New list',
      updatedAt: new Date(4000),
    });
    insertEntry(db, {
      id: 'l-old',
      entryType: 'list',
      title: 'Old list',
      updatedAt: new Date(2000),
    });
    insertEntry(db, {
      id: 'n-new',
      entryType: 'note',
      title: 'New note',
      updatedAt: new Date(3000),
    });

    const result = getLibraryEntries({ contentType: 'all' }, 'content-type', db);

    expect(result.map((e) => e.id)).toEqual(['l-new', 'l-old', 'n-new', 'n-old']);
  });
});
