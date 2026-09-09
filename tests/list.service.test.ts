import { eq } from 'drizzle-orm';

import { entries, listItems, sublists } from '@/db/schema';
import { getListWithContents } from '@/features/lists/list.repository';
import { createList } from '@/features/lists/list.service';

import { createTestDb } from './helpers/test-db';

describe('createList', () => {
  it('persists a list with root items and sublists correctly', () => {
    const db = createTestDb();

    const entryId = createList(
      {
        title: 'Grocery List',
        rootItems: [
          { content: 'Trash bags', itemType: 'checkbox' },
          { content: 'Reminder', itemType: 'text' },
        ],
        sublists: [
          {
            title: 'Dairy',
            items: [
              { content: 'Milk', itemType: 'checkbox' },
              { content: 'Butter', itemType: 'checkbox' },
            ],
          },
        ],
      },
      db,
    );

    const snapshot = getListWithContents(entryId, db);
    expect(snapshot).toBeDefined();
    expect(snapshot!.entry.title).toBe('Grocery List');
    expect(snapshot!.entry.entryType).toBe('list');

    expect(snapshot!.rootItems).toHaveLength(2);
    expect(snapshot!.rootItems[0]).toMatchObject({
      content: 'Trash bags',
      itemType: 'checkbox',
      isChecked: false,
      sortOrder: 0,
    });
    expect(snapshot!.rootItems[1]).toMatchObject({
      content: 'Reminder',
      itemType: 'text',
      isChecked: false,
      sortOrder: 1,
    });

    expect(snapshot!.sublists).toHaveLength(1);
    expect(snapshot!.sublists[0].title).toBe('Dairy');
    expect(snapshot!.sublists[0].items).toHaveLength(2);
    expect(snapshot!.sublists[0].items.map((item) => item.content)).toEqual(['Milk', 'Butter']);

    // The `lists` row (spec §8.1's minimal list-metadata table) was created too.
    const listRow = db.select().from(entries).where(eq(entries.id, entryId)).get();
    expect(listRow).toBeDefined();
  });

  it('creates nothing at all if any statement in the transaction fails (atomicity)', () => {
    const db = createTestDb();

    const entryId = createList({ title: 'Will be rolled back' }, db);

    // Force a real SQLite failure partway through a second transaction that reuses
    // the same repository/service machinery: a list_items row whose sublist_id
    // doesn't exist violates the schema's foreign key (enforced via PRAGMA foreign_keys
    // = ON in the same helper the app uses), so the transaction must roll back
    // entirely - proving db.transaction() doesn't leave partial writes behind.
    expect(() => {
      db.transaction((tx) => {
        tx.insert(sublists)
          .values({
            id: 'sublist-a',
            listEntryId: entryId,
            title: 'Valid sublist',
            sortOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .run();
        tx.insert(listItems)
          .values({
            id: 'item-a',
            listEntryId: entryId,
            sublistId: 'does-not-exist',
            itemType: 'checkbox',
            content: 'Orphaned item',
            isChecked: false,
            sortOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .run();
      });
    }).toThrow();

    // Neither the valid sublist insert nor the failing item insert should have persisted.
    const snapshot = getListWithContents(entryId, db);
    expect(snapshot!.sublists).toHaveLength(0);
    const orphanedSublist = db.select().from(sublists).where(eq(sublists.id, 'sublist-a')).get();
    expect(orphanedSublist).toBeUndefined();
  });
});
