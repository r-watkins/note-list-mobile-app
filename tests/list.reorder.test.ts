import { getListWithContents } from '@/features/lists/list.repository';
import { createList, moveListItem, moveSublist } from '@/features/lists/list.service';

import { createTestDb } from './helpers/test-db';

describe('moveListItem', () => {
  it('swaps sort_order with the previous sibling when moving up', () => {
    const db = createTestDb();
    const entryId = createList(
      {
        title: 'Groceries',
        rootItems: [
          { content: 'Milk', itemType: 'checkbox' },
          { content: 'Eggs', itemType: 'checkbox' },
          { content: 'Bread', itemType: 'checkbox' },
        ],
      },
      db,
    );
    const before = getListWithContents(entryId, db)!;
    const eggs = before.rootItems.find((item) => item.content === 'Eggs')!;

    moveListItem(eggs.id, 'up', db);

    const after = getListWithContents(entryId, db)!;
    expect(after.rootItems.map((item) => item.content)).toEqual(['Eggs', 'Milk', 'Bread']);
  });

  it('swaps sort_order with the next sibling when moving down', () => {
    const db = createTestDb();
    const entryId = createList(
      {
        title: 'Groceries',
        rootItems: [
          { content: 'Milk', itemType: 'checkbox' },
          { content: 'Eggs', itemType: 'checkbox' },
          { content: 'Bread', itemType: 'checkbox' },
        ],
      },
      db,
    );
    const before = getListWithContents(entryId, db)!;
    const milk = before.rootItems.find((item) => item.content === 'Milk')!;

    moveListItem(milk.id, 'down', db);

    const after = getListWithContents(entryId, db)!;
    expect(after.rootItems.map((item) => item.content)).toEqual(['Eggs', 'Milk', 'Bread']);
  });

  it('is a no-op moving the first item up or the last item down', () => {
    const db = createTestDb();
    const entryId = createList(
      {
        title: 'Groceries',
        rootItems: [
          { content: 'Milk', itemType: 'checkbox' },
          { content: 'Eggs', itemType: 'checkbox' },
        ],
      },
      db,
    );
    const before = getListWithContents(entryId, db)!;
    const [milk, eggs] = before.rootItems;

    moveListItem(milk.id, 'up', db);
    moveListItem(eggs.id, 'down', db);

    const after = getListWithContents(entryId, db)!;
    expect(after.rootItems.map((item) => item.content)).toEqual(['Milk', 'Eggs']);
  });

  it('only reorders within the same container - root items and a sublist are independent scopes', () => {
    const db = createTestDb();
    const entryId = createList(
      {
        title: 'Groceries',
        rootItems: [{ content: 'Root A', itemType: 'checkbox' }],
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
    const before = getListWithContents(entryId, db)!;
    const milk = before.sublists[0].items.find((item) => item.content === 'Milk')!;

    moveListItem(milk.id, 'down', db);

    const after = getListWithContents(entryId, db)!;
    expect(after.rootItems.map((item) => item.content)).toEqual(['Root A']);
    expect(after.sublists[0].items.map((item) => item.content)).toEqual(['Butter', 'Milk']);
  });
});

describe('moveSublist', () => {
  it('swaps sort_order with the adjacent sublist', () => {
    const db = createTestDb();
    const entryId = createList(
      {
        title: 'Groceries',
        sublists: [
          { title: 'Dairy', items: [] },
          { title: 'Produce', items: [] },
          { title: 'Bakery', items: [] },
        ],
      },
      db,
    );
    const before = getListWithContents(entryId, db)!;
    const produce = before.sublists.find((sublist) => sublist.title === 'Produce')!;

    moveSublist(produce.id, 'up', db);

    const after = getListWithContents(entryId, db)!;
    expect(after.sublists.map((sublist) => sublist.title)).toEqual(['Produce', 'Dairy', 'Bakery']);
  });

  it('is a no-op moving the first sublist up or the last sublist down', () => {
    const db = createTestDb();
    const entryId = createList(
      {
        title: 'Groceries',
        sublists: [
          { title: 'Dairy', items: [] },
          { title: 'Produce', items: [] },
        ],
      },
      db,
    );
    const before = getListWithContents(entryId, db)!;
    const [dairy, produce] = before.sublists;

    moveSublist(dairy.id, 'up', db);
    moveSublist(produce.id, 'down', db);

    const after = getListWithContents(entryId, db)!;
    expect(after.sublists.map((sublist) => sublist.title)).toEqual(['Dairy', 'Produce']);
  });
});
