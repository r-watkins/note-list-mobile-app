import type { ListItemRow, SublistWithItems } from '@/features/lists/list.repository';

/**
 * The list detail screen (spec §13: "long list views" must use a virtualized list, same as
 * Library's FlashList) flattens root items, each sublist's header/items/quick-add, and the
 * trailing "Add sublist" button into one ordered array so a single FlashList can virtualize
 * across the whole screen - not just within one section. `roundedTop`/`roundedBottom`/
 * `borderTop` let each row recreate its slice of the Card visual (rounded-xl border box)
 * that used to be one physical Card per section; see list-detail-row.tsx for how they're
 * consumed.
 */
export type ListDetailRow =
  | {
      key: string;
      kind: 'item';
      item: ListItemRow;
      sublistId: string | null;
      isFirstMovable: boolean;
      isLastMovable: boolean;
      roundedTop: boolean;
      borderTop: boolean;
    }
  | {
      key: string;
      kind: 'quick-add';
      sublistId: string | null;
      placeholder: string;
      roundedTop: boolean;
      borderTop: boolean;
    }
  | {
      key: string;
      kind: 'sublist-header';
      sublist: SublistWithItems;
      isFirstMovable: boolean;
      isLastMovable: boolean;
    }
  | { key: string; kind: 'add-sublist-button' };

export function buildListDetailRows(
  rootItems: ListItemRow[],
  sublists: SublistWithItems[],
): ListDetailRow[] {
  const rows: ListDetailRow[] = [];

  rootItems.forEach((item, index) => {
    rows.push({
      key: `root-item-${item.id}`,
      kind: 'item',
      item,
      sublistId: null,
      isFirstMovable: index === 0,
      isLastMovable: index === rootItems.length - 1,
      roundedTop: index === 0,
      borderTop: false,
    });
  });
  rows.push({
    key: 'root-quick-add',
    kind: 'quick-add',
    sublistId: null,
    placeholder: 'Add an item',
    roundedTop: rootItems.length === 0,
    borderTop: false,
  });

  sublists.forEach((sublist, sublistIndex) => {
    rows.push({
      key: `sublist-header-${sublist.id}`,
      kind: 'sublist-header',
      sublist,
      isFirstMovable: sublistIndex === 0,
      isLastMovable: sublistIndex === sublists.length - 1,
    });
    sublist.items.forEach((item, itemIndex) => {
      rows.push({
        key: `sublist-item-${item.id}`,
        kind: 'item',
        item,
        sublistId: sublist.id,
        isFirstMovable: itemIndex === 0,
        isLastMovable: itemIndex === sublist.items.length - 1,
        roundedTop: false,
        borderTop: itemIndex === 0,
      });
    });
    rows.push({
      key: `sublist-quick-add-${sublist.id}`,
      kind: 'quick-add',
      sublistId: sublist.id,
      placeholder: `Add item to ${sublist.title}`,
      roundedTop: false,
      borderTop: sublist.items.length === 0,
    });
  });

  rows.push({ key: 'add-sublist-button', kind: 'add-sublist-button' });

  return rows;
}
