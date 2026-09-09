import { getListWithContents, updateListItem } from '@/features/lists/list.repository';
import {
  BULK_CHECK_CONFIRM_THRESHOLD,
  bulkSetChecked,
  createList,
  getBulkCheckImpact,
} from '@/features/lists/list.service';

import { createTestDb } from './helpers/test-db';

function checkboxItems(count: number, prefix: string) {
  return Array.from({ length: count }, (_, i) => ({
    content: `${prefix} ${i}`,
    itemType: 'checkbox' as const,
  }));
}

describe('BULK_CHECK_CONFIRM_THRESHOLD', () => {
  it('is the spec-mandated value of 10', () => {
    expect(BULK_CHECK_CONFIRM_THRESHOLD).toBe(10);
  });
});

describe('getBulkCheckImpact', () => {
  it('does not require confirmation at exactly the threshold', () => {
    const db = createTestDb();
    const entryId = createList({ title: 'List', rootItems: checkboxItems(10, 'Item') }, db);

    const impact = getBulkCheckImpact({ type: 'list', listEntryId: entryId }, true, db);
    expect(impact.affectedCount).toBe(10);
    expect(impact.requiresConfirmation).toBe(false);
  });

  it('requires confirmation just above the threshold', () => {
    const db = createTestDb();
    const entryId = createList({ title: 'List', rootItems: checkboxItems(11, 'Item') }, db);

    const impact = getBulkCheckImpact({ type: 'list', listEntryId: entryId }, true, db);
    expect(impact.affectedCount).toBe(11);
    expect(impact.requiresConfirmation).toBe(true);
  });

  it('counts only items that would actually change state, not every checkbox item', () => {
    const db = createTestDb();
    const entryId = createList({ title: 'List', rootItems: checkboxItems(20, 'Item') }, db);
    const items = getListWithContents(entryId, db)!.rootItems;
    // Pre-check 15 of the 20; only the remaining 5 would flip on a "check all".
    items
      .slice(0, 15)
      .forEach((item) => updateListItem(item.id, { isChecked: true }, new Date(), db));

    const impact = getBulkCheckImpact({ type: 'list', listEntryId: entryId }, true, db);
    expect(impact.affectedCount).toBe(5);
    expect(impact.requiresConfirmation).toBe(false);
  });
});

describe('bulkSetChecked at list and sublist scope', () => {
  it('check-all and uncheck-all at list scope flip every checkbox item in the list', () => {
    const db = createTestDb();
    const entryId = createList({ title: 'List', rootItems: checkboxItems(3, 'Item') }, db);

    bulkSetChecked({ type: 'list', listEntryId: entryId }, true, db);
    expect(getListWithContents(entryId, db)!.rootItems.every((item) => item.isChecked)).toBe(true);

    bulkSetChecked({ type: 'list', listEntryId: entryId }, false, db);
    expect(getListWithContents(entryId, db)!.rootItems.every((item) => !item.isChecked)).toBe(true);
  });

  it('check-all and uncheck-all at sublist scope only affect that sublist, not root items or other sublists', () => {
    const db = createTestDb();
    const entryId = createList(
      {
        title: 'List',
        rootItems: [{ content: 'Root item', itemType: 'checkbox' }],
        sublists: [
          { title: 'Sublist A', items: checkboxItems(2, 'A') },
          { title: 'Sublist B', items: checkboxItems(2, 'B') },
        ],
      },
      db,
    );
    const sublistAId = getListWithContents(entryId, db)!.sublists[0].id;

    bulkSetChecked({ type: 'sublist', sublistId: sublistAId }, true, db);
    let snapshot = getListWithContents(entryId, db)!;
    expect(snapshot.sublists[0].items.every((item) => item.isChecked)).toBe(true); // Sublist A checked
    expect(snapshot.sublists[1].items.every((item) => !item.isChecked)).toBe(true); // Sublist B untouched
    expect(snapshot.rootItems[0].isChecked).toBe(false); // root item untouched

    bulkSetChecked({ type: 'sublist', sublistId: sublistAId }, false, db);
    snapshot = getListWithContents(entryId, db)!;
    expect(snapshot.sublists[0].items.every((item) => !item.isChecked)).toBe(true); // Sublist A unchecked again
    expect(snapshot.sublists[1].items.every((item) => !item.isChecked)).toBe(true); // Sublist B still untouched
  });
});
