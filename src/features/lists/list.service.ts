import { db, type DbClient } from '@/db/client';
import {
  countCheckboxItems,
  deleteListEntry,
  getListItemById,
  getListItemSiblings,
  getSublistById,
  getSublistSiblings,
  insertListEntry,
  insertListItem,
  insertSublist,
  setAllChecked,
  updateListItem,
  updateSublistSortOrder,
  type BulkCheckScope,
} from '@/features/lists/list.repository';
import { generateId } from '@/lib/id';

/** MVP reordering (spec §11.2): explicit move actions, no drag-and-drop. */
export type MoveDirection = 'up' | 'down';

/**
 * Confirm "check all"/"uncheck all" only when more than this many items would actually
 * change state (spec §5.4 - "keep this threshold as a named constant").
 */
export const BULK_CHECK_CONFIRM_THRESHOLD = 10;

export type CreateListItemInput = { content: string; itemType: 'checkbox' | 'text' };
export type CreateSublistInput = { title: string; items: CreateListItemInput[] };
export type CreateListInput = {
  title: string;
  rootItems?: CreateListItemInput[];
  sublists?: CreateSublistInput[];
};

/**
 * Creates a list along with its initial root items and sublists (with their items)
 * in a single transaction (spec §9.3). Returns the new list's entry id.
 */
export function createList(input: CreateListInput, executor: DbClient = db): string {
  const entryId = generateId();
  const now = new Date();

  executor.transaction((tx) => {
    insertListEntry({ id: entryId, title: input.title, now }, tx);

    (input.rootItems ?? []).forEach((item, index) => {
      insertListItem(
        {
          id: generateId(),
          listEntryId: entryId,
          sublistId: null,
          itemType: item.itemType,
          content: item.content,
          sortOrder: index,
          now,
        },
        tx,
      );
    });

    (input.sublists ?? []).forEach((sublist, sublistIndex) => {
      const sublistId = generateId();
      insertSublist(
        { id: sublistId, listEntryId: entryId, title: sublist.title, sortOrder: sublistIndex, now },
        tx,
      );
      sublist.items.forEach((item, itemIndex) => {
        insertListItem(
          {
            id: generateId(),
            listEntryId: entryId,
            sublistId,
            itemType: item.itemType,
            content: item.content,
            sortOrder: itemIndex,
            now,
          },
          tx,
        );
      });
    });
  });

  return entryId;
}

/** Deletes a list and everything under it (spec §9.3); cascade removes sublists/items. */
export function deleteList(entryId: string, executor: DbClient = db): void {
  executor.transaction((tx) => {
    deleteListEntry(entryId, tx);
  });
}

/** How many checkbox items a bulk check/uncheck at this scope would actually flip. */
export function getBulkCheckImpact(
  scope: BulkCheckScope,
  targetChecked: boolean,
  executor: DbClient = db,
): { affectedCount: number; requiresConfirmation: boolean } {
  const affectedCount = countCheckboxItems(scope, { isChecked: !targetChecked }, executor);
  return { affectedCount, requiresConfirmation: affectedCount > BULK_CHECK_CONFIRM_THRESHOLD };
}

/** Checks or unchecks every checkbox item at list or sublist scope (spec §5.4, §9.3). */
export function bulkSetChecked(
  scope: BulkCheckScope,
  isChecked: boolean,
  executor: DbClient = db,
): void {
  const now = new Date();
  executor.transaction((tx) => {
    setAllChecked(scope, isChecked, now, tx);
  });
}

/** Index a move would land on among ordered siblings, or -1 if it's a no-op (already at an edge). */
function moveTargetIndex(siblingCount: number, currentIndex: number, direction: MoveDirection): number {
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex === -1 || targetIndex < 0 || targetIndex >= siblingCount) {
    return -1;
  }
  return targetIndex;
}

/**
 * Moves an item up/down within its container (root items of a list, or one sublist's items)
 * by swapping sort_order with the adjacent sibling. No-op at either edge (spec §11.2 MVP).
 */
export function moveListItem(
  itemId: string,
  direction: MoveDirection,
  executor: DbClient = db,
): void {
  executor.transaction((tx) => {
    const item = getListItemById(itemId, tx);
    if (!item) {
      return;
    }
    const siblings = getListItemSiblings(item.listEntryId, item.sublistId, tx);
    const currentIndex = siblings.findIndex((sibling) => sibling.id === itemId);
    const targetIndex = moveTargetIndex(siblings.length, currentIndex, direction);
    if (targetIndex === -1) {
      return;
    }
    const target = siblings[targetIndex];
    const now = new Date();
    updateListItem(item.id, { sortOrder: target.sortOrder }, now, tx);
    updateListItem(target.id, { sortOrder: item.sortOrder }, now, tx);
  });
}

/** Moves a sublist up/down within its list by swapping sort_order with the adjacent sibling. */
export function moveSublist(
  sublistId: string,
  direction: MoveDirection,
  executor: DbClient = db,
): void {
  executor.transaction((tx) => {
    const sublist = getSublistById(sublistId, tx);
    if (!sublist) {
      return;
    }
    const siblings = getSublistSiblings(sublist.listEntryId, tx);
    const currentIndex = siblings.findIndex((sibling) => sibling.id === sublistId);
    const targetIndex = moveTargetIndex(siblings.length, currentIndex, direction);
    if (targetIndex === -1) {
      return;
    }
    const target = siblings[targetIndex];
    const now = new Date();
    updateSublistSortOrder(sublist.id, target.sortOrder, now, tx);
    updateSublistSortOrder(target.id, sublist.sortOrder, now, tx);
  });
}
