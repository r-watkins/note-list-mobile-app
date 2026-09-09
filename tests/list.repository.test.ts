import { getListWithContents, updateListItem } from '@/features/lists/list.repository';
import { bulkSetChecked, createList } from '@/features/lists/list.service';

import { createTestDb } from './helpers/test-db';

describe('checking/unchecking an individual checkbox item', () => {
  it('persists isChecked and can be toggled back', () => {
    const db = createTestDb();
    const entryId = createList(
      { title: 'Groceries', rootItems: [{ content: 'Milk', itemType: 'checkbox' }] },
      db,
    );

    const before = getListWithContents(entryId, db)!;
    const itemId = before.rootItems[0].id;
    expect(before.rootItems[0].isChecked).toBe(false);

    updateListItem(itemId, { isChecked: true }, new Date(), db);
    expect(getListWithContents(entryId, db)!.rootItems[0].isChecked).toBe(true);

    updateListItem(itemId, { isChecked: false }, new Date(), db);
    expect(getListWithContents(entryId, db)!.rootItems[0].isChecked).toBe(false);
  });

  it('leaves a sibling text item unaffected', () => {
    const db = createTestDb();
    const entryId = createList(
      {
        title: 'Groceries',
        rootItems: [
          { content: 'Milk', itemType: 'checkbox' },
          { content: 'Reminder', itemType: 'text' },
        ],
      },
      db,
    );
    const textItemId = getListWithContents(entryId, db)!.rootItems[1].id;
    const checkboxItemId = getListWithContents(entryId, db)!.rootItems[0].id;

    updateListItem(checkboxItemId, { isChecked: true }, new Date(), db);

    const textItem = getListWithContents(entryId, db)!.rootItems[1];
    expect(textItem.id).toBe(textItemId);
    expect(textItem.isChecked).toBe(false);
    expect(textItem.content).toBe('Reminder');
  });
});

describe('bulk check/uncheck leaves text items untouched', () => {
  it('check-all and uncheck-all at list scope only ever affect checkbox items', () => {
    const db = createTestDb();
    const entryId = createList(
      {
        title: 'Groceries',
        rootItems: [
          { content: 'Milk', itemType: 'checkbox' },
          { content: 'Buy in bulk next time', itemType: 'text' },
        ],
      },
      db,
    );
    const originalTextItem = getListWithContents(entryId, db)!.rootItems[1];
    expect(originalTextItem.itemType).toBe('text');

    bulkSetChecked({ type: 'list', listEntryId: entryId }, true, db);
    let snapshot = getListWithContents(entryId, db)!;
    expect(snapshot.rootItems[0].isChecked).toBe(true); // the checkbox item did flip
    const textAfterCheckAll = snapshot.rootItems[1];
    expect(textAfterCheckAll.isChecked).toBe(false);
    expect(textAfterCheckAll.updatedAt).toEqual(originalTextItem.updatedAt); // untouched, not just still false

    bulkSetChecked({ type: 'list', listEntryId: entryId }, false, db);
    snapshot = getListWithContents(entryId, db)!;
    expect(snapshot.rootItems[0].isChecked).toBe(false); // the checkbox item flipped back
    const textAfterUncheckAll = snapshot.rootItems[1];
    expect(textAfterUncheckAll.isChecked).toBe(false);
    expect(textAfterUncheckAll.updatedAt).toEqual(originalTextItem.updatedAt); // still untouched
  });

  it('check-all at sublist scope only affects checkbox items within that sublist', () => {
    const db = createTestDb();
    const entryId = createList(
      {
        title: 'Groceries',
        sublists: [
          {
            title: 'Dairy',
            items: [
              { content: 'Milk', itemType: 'checkbox' },
              { content: 'Ask about oat milk', itemType: 'text' },
            ],
          },
        ],
      },
      db,
    );
    const sublistId = getListWithContents(entryId, db)!.sublists[0].id;
    const originalTextItem = getListWithContents(entryId, db)!.sublists[0].items[1];

    bulkSetChecked({ type: 'sublist', sublistId }, true, db);

    const snapshot = getListWithContents(entryId, db)!.sublists[0];
    expect(snapshot.items[0].isChecked).toBe(true);
    expect(snapshot.items[1].isChecked).toBe(false);
    expect(snapshot.items[1].updatedAt).toEqual(originalTextItem.updatedAt);
  });
});
