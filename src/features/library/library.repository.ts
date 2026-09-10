import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

import { db, type DbClient } from '@/db/client';
import { entries, entryLabels, labels } from '@/db/schema';

export type LibraryEntryRow = typeof entries.$inferSelect;
export type LabelRow = typeof labels.$inferSelect;

export type LibraryEntryWithLabels = LibraryEntryRow & { labels: LabelRow[] };

export type LibraryContentTypeFilter = 'all' | 'list' | 'note';
export type LibrarySort = 'updated-desc' | 'title-asc' | 'content-type';

export type LibraryFilter = {
  contentType: LibraryContentTypeFilter;
  /**
   * Labels only ever attach to notes in MVP (spec §7.3) - when set, this forces the
   * effective content type to 'note' regardless of `contentType`, matching the spec's
   * stated "lists should not appear while a label filter is active" behavior.
   */
  labelId?: string;
};

function sortColumns(sort: LibrarySort) {
  switch (sort) {
    case 'updated-desc':
      return [desc(entries.updatedAt)];
    case 'title-asc':
      return [asc(sql`${entries.title} collate nocase`)];
    case 'content-type':
      return [asc(entries.entryType), desc(entries.updatedAt)];
  }
}

/** Labels for a set of entries, keyed by entry id - only note entries will ever have any. */
function getLabelsByEntryId(entryIds: string[], executor: DbClient): Map<string, LabelRow[]> {
  const byEntryId = new Map<string, LabelRow[]>();
  if (entryIds.length === 0) {
    return byEntryId;
  }

  const rows = executor
    .select({ entryId: entryLabels.entryId, label: labels })
    .from(entryLabels)
    .innerJoin(labels, eq(labels.id, entryLabels.labelId))
    .where(inArray(entryLabels.entryId, entryIds))
    .all();

  for (const row of rows) {
    const existing = byEntryId.get(row.entryId);
    if (existing) {
      existing.push(row.label);
    } else {
      byEntryId.set(row.entryId, [row.label]);
    }
  }
  return byEntryId;
}

/**
 * Unified list+note entries matching the content-type/label filter, in the requested
 * sort order (spec §7.3). Search text matching (spec §8.3) is layered on top of this
 * by Task 31 - this function only covers filter and sort.
 */
export function getLibraryEntries(
  filter: LibraryFilter,
  sort: LibrarySort,
  executor: DbClient = db,
): LibraryEntryWithLabels[] {
  const effectiveType: LibraryContentTypeFilter =
    filter.labelId !== undefined ? 'note' : filter.contentType;
  const typeCondition = effectiveType === 'all' ? undefined : eq(entries.entryType, effectiveType);

  const entryRows =
    filter.labelId === undefined
      ? executor
          .select()
          .from(entries)
          .where(typeCondition)
          .orderBy(...sortColumns(sort))
          .all()
      : executor
          .select({ entry: entries })
          .from(entries)
          .innerJoin(entryLabels, eq(entryLabels.entryId, entries.id))
          .where(and(typeCondition, eq(entryLabels.labelId, filter.labelId)))
          .orderBy(...sortColumns(sort))
          .all()
          .map((row) => row.entry);

  const labelsByEntryId = getLabelsByEntryId(
    entryRows.map((entry) => entry.id),
    executor,
  );

  return entryRows.map((entry) => ({ ...entry, labels: labelsByEntryId.get(entry.id) ?? [] }));
}
