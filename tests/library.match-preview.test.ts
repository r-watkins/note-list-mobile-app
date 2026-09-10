import { getListSearchMatchPreview } from '@/features/library/library.repository';
import { createList } from '@/features/lists/list.service';

import { createTestDb } from './helpers/test-db';

describe('getListSearchMatchPreview', () => {
  it('returns undefined when the list title itself matches (no extra context needed)', () => {
    const db = createTestDb();
    const entryId = createList({ title: 'Grocery List' }, db);

    expect(getListSearchMatchPreview({ id: entryId, title: 'Grocery List' }, 'grocery', db)).toBe(
      undefined,
    );
  });

  it('returns the sublist title alone when a sublist title matches', () => {
    const db = createTestDb();
    const entryId = createList(
      { title: 'Grocery List', sublists: [{ title: 'Dairy', items: [] }] },
      db,
    );

    expect(getListSearchMatchPreview({ id: entryId, title: 'Grocery List' }, 'dairy', db)).toBe(
      'Dairy',
    );
  });

  it('returns just the item content for a matching root item', () => {
    const db = createTestDb();
    const entryId = createList(
      { title: 'Grocery List', rootItems: [{ content: 'Trash bags', itemType: 'checkbox' }] },
      db,
    );

    expect(getListSearchMatchPreview({ id: entryId, title: 'Grocery List' }, 'trash', db)).toBe(
      'Trash bags',
    );
  });

  it('returns "sublist · item" for a matching item nested in a sublist', () => {
    const db = createTestDb();
    const entryId = createList(
      {
        title: 'Grocery List',
        sublists: [{ title: 'Dairy', items: [{ content: 'Milk', itemType: 'checkbox' }] }],
      },
      db,
    );

    expect(getListSearchMatchPreview({ id: entryId, title: 'Grocery List' }, 'milk', db)).toBe(
      'Dairy · Milk',
    );
  });

  it('prefers a sublist title match over an item match when both would match', () => {
    const db = createTestDb();
    const entryId = createList(
      {
        title: 'Grocery List',
        sublists: [{ title: 'Produce', items: [{ content: 'Produce bag', itemType: 'checkbox' }] }],
      },
      db,
    );

    expect(getListSearchMatchPreview({ id: entryId, title: 'Grocery List' }, 'produce', db)).toBe(
      'Produce',
    );
  });

  it('returns undefined when nothing matches', () => {
    const db = createTestDb();
    const entryId = createList(
      {
        title: 'Grocery List',
        rootItems: [{ content: 'Trash bags', itemType: 'checkbox' }],
        sublists: [{ title: 'Dairy', items: [{ content: 'Milk', itemType: 'checkbox' }] }],
      },
      db,
    );

    expect(getListSearchMatchPreview({ id: entryId, title: 'Grocery List' }, 'camping', db)).toBe(
      undefined,
    );
  });

  it('is case-insensitive on the title short-circuit check', () => {
    const db = createTestDb();
    const entryId = createList({ title: 'Grocery List' }, db);

    expect(getListSearchMatchPreview({ id: entryId, title: 'Grocery List' }, 'GROCERY', db)).toBe(
      undefined,
    );
  });
});
