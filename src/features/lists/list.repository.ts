import { and, asc, eq, sql } from 'drizzle-orm';

import { db, type DbClient } from '@/db/client';
import { entries, listItems, lists, sublists } from '@/db/schema';

export type ListEntryRow = typeof entries.$inferSelect;
export type SublistRow = typeof sublists.$inferSelect;
export type ListItemRow = typeof listItems.$inferSelect;

export type SublistWithItems = SublistRow & { items: ListItemRow[] };

export type ListWithContents = {
  entry: ListEntryRow;
  rootItems: ListItemRow[];
  sublists: SublistWithItems[];
};

/** Scopes a bulk checkbox operation to an entire list or to one sublist within it. */
export type BulkCheckScope =
  { type: 'list'; listEntryId: string } | { type: 'sublist'; sublistId: string };

function bulkCheckScopeCondition(scope: BulkCheckScope) {
  return scope.type === 'list'
    ? eq(listItems.listEntryId, scope.listEntryId)
    : eq(listItems.sublistId, scope.sublistId);
}

/** Reads a list entry with its root items and sublists (each with their own items), in sort order. */
export function getListWithContents(
  entryId: string,
  executor: DbClient = db,
): ListWithContents | undefined {
  const entry = executor
    .select()
    .from(entries)
    .where(and(eq(entries.id, entryId), eq(entries.entryType, 'list')))
    .get();
  if (!entry) {
    return undefined;
  }

  const allSublists = executor
    .select()
    .from(sublists)
    .where(eq(sublists.listEntryId, entryId))
    .orderBy(asc(sublists.sortOrder))
    .all();

  const allItems = executor
    .select()
    .from(listItems)
    .where(eq(listItems.listEntryId, entryId))
    .orderBy(asc(listItems.sortOrder))
    .all();

  const itemsBySublistId = new Map<string, ListItemRow[]>();
  const rootItems: ListItemRow[] = [];
  for (const item of allItems) {
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
    entry,
    rootItems,
    sublists: allSublists.map((sublist) => ({
      ...sublist,
      items: itemsBySublistId.get(sublist.id) ?? [],
    })),
  };
}

export type InsertListEntryInput = { id: string; title: string; now: Date };

/** Inserts the `entries` row and its `lists` row for a new list. */
export function insertListEntry(input: InsertListEntryInput, executor: DbClient = db): void {
  executor
    .insert(entries)
    .values({
      id: input.id,
      entryType: 'list',
      title: input.title,
      createdAt: input.now,
      updatedAt: input.now,
    })
    .run();
  executor.insert(lists).values({ entryId: input.id }).run();
}

export function updateListEntryTitle(
  entryId: string,
  title: string,
  now: Date,
  executor: DbClient = db,
): void {
  executor.update(entries).set({ title, updatedAt: now }).where(eq(entries.id, entryId)).run();
}

/** Deletes the list's `entries` row; `onDelete: 'cascade'` removes its `lists`/sublists/items rows. */
export function deleteListEntry(entryId: string, executor: DbClient = db): void {
  executor.delete(entries).where(eq(entries.id, entryId)).run();
}

export type InsertSublistInput = {
  id: string;
  listEntryId: string;
  title: string;
  sortOrder: number;
  now: Date;
};

export function insertSublist(input: InsertSublistInput, executor: DbClient = db): void {
  executor
    .insert(sublists)
    .values({
      id: input.id,
      listEntryId: input.listEntryId,
      title: input.title,
      sortOrder: input.sortOrder,
      createdAt: input.now,
      updatedAt: input.now,
    })
    .run();
}

export function updateSublistTitle(
  sublistId: string,
  title: string,
  now: Date,
  executor: DbClient = db,
): void {
  executor.update(sublists).set({ title, updatedAt: now }).where(eq(sublists.id, sublistId)).run();
}

/** Deletes the sublist; `onDelete: 'cascade'` removes its items. */
export function deleteSublist(sublistId: string, executor: DbClient = db): void {
  executor.delete(sublists).where(eq(sublists.id, sublistId)).run();
}

/** Number of items currently in a sublist - used to decide whether delete needs confirmation. */
export function getSublistItemCount(sublistId: string, executor: DbClient = db): number {
  const result = executor
    .select({ count: sql<number>`count(*)` })
    .from(listItems)
    .where(eq(listItems.sublistId, sublistId))
    .get();
  return result?.count ?? 0;
}

export type InsertListItemInput = {
  id: string;
  listEntryId: string;
  sublistId: string | null;
  itemType: 'checkbox' | 'text';
  content: string;
  sortOrder: number;
  now: Date;
};

export function insertListItem(input: InsertListItemInput, executor: DbClient = db): void {
  executor
    .insert(listItems)
    .values({
      id: input.id,
      listEntryId: input.listEntryId,
      sublistId: input.sublistId,
      itemType: input.itemType,
      content: input.content,
      // is_checked is only meaningful for checkbox items (spec §8.1) - always starts false.
      isChecked: false,
      sortOrder: input.sortOrder,
      createdAt: input.now,
      updatedAt: input.now,
    })
    .run();
}

export type ListItemChanges = Partial<{
  content: string;
  itemType: 'checkbox' | 'text';
  isChecked: boolean;
  sortOrder: number;
}>;

export function updateListItem(
  itemId: string,
  changes: ListItemChanges,
  now: Date,
  executor: DbClient = db,
): void {
  executor
    .update(listItems)
    .set({ ...changes, updatedAt: now })
    .where(eq(listItems.id, itemId))
    .run();
}

export function deleteListItem(itemId: string, executor: DbClient = db): void {
  executor.delete(listItems).where(eq(listItems.id, itemId)).run();
}

/** Counts checkbox items in scope, optionally narrowed to a current checked state. */
export function countCheckboxItems(
  scope: BulkCheckScope,
  filter: { isChecked?: boolean } = {},
  executor: DbClient = db,
): number {
  const conditions = [eq(listItems.itemType, 'checkbox'), bulkCheckScopeCondition(scope)];
  if (filter.isChecked !== undefined) {
    conditions.push(eq(listItems.isChecked, filter.isChecked));
  }
  const result = executor
    .select({ count: sql<number>`count(*)` })
    .from(listItems)
    .where(and(...conditions))
    .get();
  return result?.count ?? 0;
}

/** Sets every checkbox item in scope to `isChecked`; only rows actually changing state are touched. */
export function setAllChecked(
  scope: BulkCheckScope,
  isChecked: boolean,
  now: Date,
  executor: DbClient = db,
): void {
  executor
    .update(listItems)
    .set({ isChecked, updatedAt: now })
    .where(
      and(
        eq(listItems.itemType, 'checkbox'),
        bulkCheckScopeCondition(scope),
        eq(listItems.isChecked, !isChecked),
      ),
    )
    .run();
}
