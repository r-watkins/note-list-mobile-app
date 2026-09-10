import { entries, entryLabels, labels, listItems, lists, sublists } from '@/db/schema';
import { getLibraryEntries } from '@/features/library/library.repository';

import { createTestDb } from './helpers/test-db';

type Db = ReturnType<typeof createTestDb>;

function insertListEntry(db: Db, id: string, title: string) {
  db.insert(entries)
    .values({ id, entryType: 'list', title, createdAt: new Date(), updatedAt: new Date() })
    .run();
  db.insert(lists).values({ entryId: id }).run();
}

function insertNoteEntry(db: Db, id: string, title: string) {
  db.insert(entries)
    .values({ id, entryType: 'note', title, createdAt: new Date(), updatedAt: new Date() })
    .run();
}

function insertSublist(db: Db, id: string, listEntryId: string, title: string) {
  db.insert(sublists)
    .values({ id, listEntryId, title, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() })
    .run();
}

function insertItem(
  db: Db,
  id: string,
  listEntryId: string,
  content: string,
  sublistId: string | null = null,
) {
  db.insert(listItems)
    .values({
      id,
      listEntryId,
      sublistId,
      itemType: 'checkbox',
      content,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .run();
}

function insertLabel(db: Db, id: string, name: string) {
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

function attachLabel(db: Db, entryId: string, labelId: string) {
  db.insert(entryLabels).values({ entryId, labelId, createdAt: new Date() }).run();
}

function search(db: Db, query: string) {
  return getLibraryEntries({ contentType: 'all', query }, 'updated-desc', db).map((e) => e.id);
}

describe('getLibraryEntries search - lists', () => {
  it('matches a list by its own title', () => {
    const db = createTestDb();
    insertListEntry(db, 'l1', 'Grocery List');
    insertListEntry(db, 'l2', 'Camping');

    expect(search(db, 'grocery')).toEqual(['l1']);
  });

  it('matches a list by a sublist title, even when the list title does not match', () => {
    const db = createTestDb();
    insertListEntry(db, 'l1', 'Grocery List');
    insertSublist(db, 's1', 'l1', 'Dairy');

    expect(search(db, 'dairy')).toEqual(['l1']);
  });

  it('matches a list by an item content, even nested inside a sublist', () => {
    const db = createTestDb();
    insertListEntry(db, 'l1', 'Grocery List');
    insertSublist(db, 's1', 'l1', 'Dairy');
    insertItem(db, 'i1', 'l1', 'Milk', 's1');

    expect(search(db, 'milk')).toEqual(['l1']);
  });

  it('matches a list by a root item content', () => {
    const db = createTestDb();
    insertListEntry(db, 'l1', 'Grocery List');
    insertItem(db, 'i1', 'l1', 'Trash bags');

    expect(search(db, 'trash')).toEqual(['l1']);
  });

  it('does not match a list with no matching title, sublist, or item', () => {
    const db = createTestDb();
    insertListEntry(db, 'l1', 'Grocery List');
    insertSublist(db, 's1', 'l1', 'Dairy');
    insertItem(db, 'i1', 'l1', 'Milk', 's1');

    expect(search(db, 'camping')).toEqual([]);
  });
});

describe('getLibraryEntries search - notes', () => {
  it('matches a note by its own title', () => {
    const db = createTestDb();
    insertNoteEntry(db, 'n1', 'Weeknight Turkey Pasta');

    expect(search(db, 'turkey')).toEqual(['n1']);
  });

  it('matches a note by an attached label name', () => {
    const db = createTestDb();
    insertNoteEntry(db, 'n1', 'Weeknight Turkey Pasta');
    insertLabel(db, 'lb1', 'Dinner');
    attachLabel(db, 'n1', 'lb1');

    expect(search(db, 'dinner')).toEqual(['n1']);
  });

  it('does not match a note by unrelated text', () => {
    const db = createTestDb();
    insertNoteEntry(db, 'n1', 'Weeknight Turkey Pasta');

    expect(search(db, 'camping')).toEqual([]);
  });
});

describe('getLibraryEntries search - cross-cutting behavior', () => {
  it('is case-insensitive', () => {
    const db = createTestDb();
    insertListEntry(db, 'l1', 'Grocery List');

    expect(search(db, 'GROCERY')).toEqual(['l1']);
  });

  it('trims whitespace from the query', () => {
    const db = createTestDb();
    insertListEntry(db, 'l1', 'Grocery List');

    expect(search(db, '  grocery  ')).toEqual(['l1']);
  });

  it('treats an empty or whitespace-only query as no search filter at all', () => {
    const db = createTestDb();
    insertListEntry(db, 'l1', 'Grocery List');
    insertNoteEntry(db, 'n1', 'Turkey Pasta');

    expect(search(db, '').sort()).toEqual(['l1', 'n1']);
    expect(search(db, '   ').sort()).toEqual(['l1', 'n1']);
  });

  it('escapes literal % and _ in the query instead of treating them as LIKE wildcards', () => {
    const db = createTestDb();
    insertListEntry(db, 'l1', '50% off list');
    insertListEntry(db, 'l2', 'a_b list');
    insertListEntry(db, 'l3', 'unrelated list');

    // A bare "%" would match every row as a wildcard if not escaped - it must not.
    expect(search(db, '50% off').sort()).toEqual(['l1']);
    // A bare "_" would match any single character as a wildcard if not escaped.
    expect(search(db, 'a_b').sort()).toEqual(['l2']);
  });

  it('combines with the content-type filter - a note-only search never returns a matching list', () => {
    const db = createTestDb();
    insertListEntry(db, 'l1', 'Grocery List');
    insertNoteEntry(db, 'n1', 'Grocery notes');

    const result = getLibraryEntries(
      { contentType: 'note', query: 'grocery' },
      'updated-desc',
      db,
    ).map((e) => e.id);

    expect(result).toEqual(['n1']);
  });

  it('combines with the label filter - only a matching, labeled note is returned', () => {
    const db = createTestDb();
    insertNoteEntry(db, 'n1', 'Grocery notes');
    insertNoteEntry(db, 'n2', 'Grocery notes, different label');
    insertLabel(db, 'lb1', 'Dinner');
    insertLabel(db, 'lb2', 'Breakfast');
    attachLabel(db, 'n1', 'lb1');
    attachLabel(db, 'n2', 'lb2');

    const result = getLibraryEntries(
      { contentType: 'all', labelId: 'lb1', query: 'grocery' },
      'updated-desc',
      db,
    ).map((e) => e.id);

    expect(result).toEqual(['n1']);
  });
});
