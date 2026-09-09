import { asc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '@/db/client';
import { entries, listItems, sublists } from '@/db/schema';
import type { ListEntryRow, ListItemRow, SublistWithItems } from '@/features/lists/list.repository';

export type ListDetail = {
  entry: ListEntryRow | undefined;
  rootItems: ListItemRow[];
  sublists: SublistWithItems[];
};

/**
 * Reactive equivalent of list.repository's getListWithContents(), composed from three
 * separate useLiveQuery calls - the expo-sqlite driver's useLiveQuery only re-runs a
 * query when its own FROM table changes (see drizzle-orm/expo-sqlite/query.js), so one
 * query per table (entries/sublists/list_items) is how this driver is meant to be used,
 * not a single joined query.
 */
export function useListDetail(entryId: string): ListDetail {
  const entryQuery = useLiveQuery(db.select().from(entries).where(eq(entries.id, entryId)));
  const sublistsQuery = useLiveQuery(
    db
      .select()
      .from(sublists)
      .where(eq(sublists.listEntryId, entryId))
      .orderBy(asc(sublists.sortOrder)),
  );
  const itemsQuery = useLiveQuery(
    db
      .select()
      .from(listItems)
      .where(eq(listItems.listEntryId, entryId))
      .orderBy(asc(listItems.sortOrder)),
  );

  const rootItems: ListItemRow[] = [];
  const itemsBySublistId = new Map<string, ListItemRow[]>();
  for (const item of itemsQuery.data) {
    if (item.sublistId === null) {
      rootItems.push(item);
      continue;
    }
    const existing = itemsBySublistId.get(item.sublistId);
    if (existing) {
      existing.push(item);
    } else {
      itemsBySublistId.set(item.sublistId, [item]);
    }
  }

  return {
    entry: entryQuery.data[0],
    rootItems,
    sublists: sublistsQuery.data.map((sublist) => ({
      ...sublist,
      items: itemsBySublistId.get(sublist.id) ?? [],
    })),
  };
}

/** Next sort_order for a new item/sublist appended to the end of `items`. */
export function nextSortOrder(items: { sortOrder: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
}
