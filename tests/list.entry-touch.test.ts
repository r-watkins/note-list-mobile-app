import { eq } from 'drizzle-orm';

import { entries } from '@/db/schema';
import {
  deleteListItem,
  deleteSublist,
  getListWithContents,
  insertListItem,
  insertSublist,
  setAllChecked,
  updateListItem,
  updateSublistTitle,
} from '@/features/lists/list.repository';
import { createList } from '@/features/lists/list.service';

import { createTestDb } from './helpers/test-db';

function entryUpdatedAt(db: ReturnType<typeof createTestDb>, entryId: string): number {
  const row = db.select().from(entries).where(eq(entries.id, entryId)).get();
  return row!.updatedAt!.getTime();
}

describe('list content mutations bump the parent entry updatedAt', () => {
  it('inserting a root item bumps the list entry', () => {
    const db = createTestDb();
    const entryId = createList({ title: 'List' }, db);
    const originalUpdatedAt = entryUpdatedAt(db, entryId);

    insertListItem(
      {
        id: 'i1',
        listEntryId: entryId,
        sublistId: null,
        itemType: 'checkbox',
        content: 'Milk',
        sortOrder: 0,
        now: new Date(originalUpdatedAt + 1000),
      },
      db,
    );

    expect(entryUpdatedAt(db, entryId)).toBe(originalUpdatedAt + 1000);
  });

  it('updating (e.g. checking) an item bumps its list entry', () => {
    const db = createTestDb();
    const entryId = createList(
      { title: 'List', rootItems: [{ content: 'Milk', itemType: 'checkbox' }] },
      db,
    );
    const itemId = getListWithContents(entryId, db)!.rootItems[0].id;
    const originalUpdatedAt = entryUpdatedAt(db, entryId);
    const later = new Date(originalUpdatedAt + 1000);

    updateListItem(itemId, { isChecked: true }, later, db);

    expect(entryUpdatedAt(db, entryId)).toBe(later.getTime());
  });

  it('deleting an item bumps its list entry', () => {
    const db = createTestDb();
    const entryId = createList(
      { title: 'List', rootItems: [{ content: 'Milk', itemType: 'checkbox' }] },
      db,
    );
    const itemId = getListWithContents(entryId, db)!.rootItems[0].id;
    const originalUpdatedAt = entryUpdatedAt(db, entryId);
    const later = new Date(originalUpdatedAt + 1000);

    deleteListItem(itemId, later, db);

    expect(entryUpdatedAt(db, entryId)).toBe(later.getTime());
  });

  it('adding, renaming, and deleting a sublist each bump the parent list entry', () => {
    const db = createTestDb();
    const entryId = createList({ title: 'List' }, db);
    let t = entryUpdatedAt(db, entryId);

    t += 1000;
    insertSublist(
      { id: 's1', listEntryId: entryId, title: 'Dairy', sortOrder: 0, now: new Date(t) },
      db,
    );
    expect(entryUpdatedAt(db, entryId)).toBe(t);

    t += 1000;
    updateSublistTitle('s1', 'Frozen', new Date(t), db);
    expect(entryUpdatedAt(db, entryId)).toBe(t);

    t += 1000;
    deleteSublist('s1', new Date(t), db);
    expect(entryUpdatedAt(db, entryId)).toBe(t);
  });

  it('bulk check/uncheck at list and sublist scope both bump the parent list entry', () => {
    const db = createTestDb();
    const entryId = createList(
      {
        title: 'List',
        sublists: [{ title: 'Dairy', items: [{ content: 'Milk', itemType: 'checkbox' }] }],
      },
      db,
    );
    const sublistId = getListWithContents(entryId, db)!.sublists[0].id;
    let t = entryUpdatedAt(db, entryId);

    t += 1000;
    setAllChecked({ type: 'sublist', sublistId }, true, new Date(t), db);
    expect(entryUpdatedAt(db, entryId)).toBe(t);

    t += 1000;
    setAllChecked({ type: 'list', listEntryId: entryId }, false, new Date(t), db);
    expect(entryUpdatedAt(db, entryId)).toBe(t);
  });

  it('does not touch an unrelated list when another list is modified', () => {
    const db = createTestDb();
    const entryA = createList({ title: 'List A' }, db);
    const entryB = createList({ title: 'List B' }, db);
    const untouchedUpdatedAt = entryUpdatedAt(db, entryB);

    insertListItem(
      {
        id: 'i1',
        listEntryId: entryA,
        sublistId: null,
        itemType: 'checkbox',
        content: 'Milk',
        sortOrder: 0,
        now: new Date(untouchedUpdatedAt + 5000),
      },
      db,
    );

    expect(entryUpdatedAt(db, entryB)).toBe(untouchedUpdatedAt);
  });
});
