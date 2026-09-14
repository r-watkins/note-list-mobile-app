import { buildListDetailRows } from '@/features/lists/list-detail-rows';
import type { ListItemRow, SublistWithItems } from '@/features/lists/list.repository';

function makeItem(id: string, overrides: Partial<ListItemRow> = {}): ListItemRow {
  const now = new Date();
  return {
    id,
    listEntryId: 'entry-1',
    sublistId: null,
    itemType: 'checkbox',
    content: id,
    isChecked: false,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeSublist(id: string, items: ListItemRow[]): SublistWithItems {
  const now = new Date();
  return {
    id,
    listEntryId: 'entry-1',
    title: id,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    items,
  };
}

describe('buildListDetailRows', () => {
  it('always includes a root quick-add row and a trailing add-sublist button, even with no data', () => {
    const rows = buildListDetailRows([], []);
    expect(rows.map((r) => r.kind)).toEqual(['quick-add', 'add-sublist-button']);
    expect(rows[0]).toMatchObject({ sublistId: null, roundedTop: true, borderTop: false });
  });

  it('gives the first root item the rounded-top card corner and no others', () => {
    const items = [makeItem('a'), makeItem('b'), makeItem('c')];
    const rows = buildListDetailRows(items, []);
    const itemRows = rows.filter((r) => r.kind === 'item');
    expect(itemRows.map((r) => (r.kind === 'item' ? r.roundedTop : undefined))).toEqual([
      true,
      false,
      false,
    ]);
    // Root quick-add follows all root items and is never rounded-top when items exist.
    const quickAdd = rows.find((r) => r.kind === 'quick-add' && r.sublistId === null);
    expect(quickAdd).toMatchObject({ roundedTop: false });
  });

  it('sets isFirstMovable/isLastMovable to match each item’s position for move-button state', () => {
    const items = [makeItem('a'), makeItem('b'), makeItem('c')];
    const rows = buildListDetailRows(items, []);
    const itemRows = rows.filter((r) => r.kind === 'item');
    expect(
      itemRows.map((r) => (r.kind === 'item' ? [r.isFirstMovable, r.isLastMovable] : null)),
    ).toEqual([
      [true, false],
      [false, false],
      [false, true],
    ]);
  });

  it('orders each sublist as header, then its items, then its own quick-add row', () => {
    const sublistItems = [makeItem('x'), makeItem('y')];
    const sublist = makeSublist('Aisle A', sublistItems);
    const rows = buildListDetailRows([], [sublist]);
    expect(rows.map((r) => r.kind)).toEqual([
      'quick-add', // root (empty root items still gets a quick-add row)
      'sublist-header',
      'item',
      'item',
      'quick-add',
      'add-sublist-button',
    ]);
  });

  it('gives a sublist header the rounded-top corner and its first item a plain divider border, not rounding', () => {
    const sublistItems = [makeItem('x'), makeItem('y')];
    const sublist = makeSublist('Aisle A', sublistItems);
    const rows = buildListDetailRows([], [sublist]);
    const header = rows.find((r) => r.kind === 'sublist-header');
    expect(header).toBeDefined();
    const [firstItem, secondItem] = rows.filter((r) => r.kind === 'item');
    expect(firstItem).toMatchObject({ roundedTop: false, borderTop: true });
    expect(secondItem).toMatchObject({ roundedTop: false, borderTop: false });
  });

  it('gives an empty sublist’s quick-add row the divider border (no items to carry it)', () => {
    const sublist = makeSublist('Empty Aisle', []);
    const rows = buildListDetailRows([], [sublist]);
    const sublistQuickAdd = rows.find((r) => r.kind === 'quick-add' && r.sublistId === sublist.id);
    expect(sublistQuickAdd).toMatchObject({ roundedTop: false, borderTop: true });
  });

  it('preserves sublist order and produces unique keys across the whole flattened list', () => {
    const sublistA = makeSublist('A', [makeItem('a1')]);
    const sublistB = makeSublist('B', [makeItem('b1')]);
    const rows = buildListDetailRows([makeItem('root1')], [sublistA, sublistB]);
    const headerTitles = rows
      .filter((r) => r.kind === 'sublist-header')
      .map((r) => (r.kind === 'sublist-header' ? r.sublist.title : null));
    expect(headerTitles).toEqual(['A', 'B']);
    const keys = rows.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
