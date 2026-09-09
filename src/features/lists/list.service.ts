import { db, type DbClient } from '@/db/client';
import {
  countCheckboxItems,
  deleteListEntry,
  insertListEntry,
  insertListItem,
  insertSublist,
  setAllChecked,
  type BulkCheckScope,
} from '@/features/lists/list.repository';
import { generateId } from '@/lib/id';

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
