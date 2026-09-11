import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { db } from '@/db/client';
import { entryLabels, labels } from '@/db/schema';
import {
  buildLibraryEntriesQuery,
  type LabelRow,
  type LibraryEntryWithLabels,
  type LibraryFilter,
  type LibrarySort,
} from '@/features/library/library.repository';

/**
 * Reactive equivalent of getLibraryEntries. Composed from two useLiveQuery calls, same
 * multi-query pattern as list.hooks.ts's useListDetail - the expo-sqlite driver's
 * useLiveQuery only re-runs a query when its own FROM table changes, so entries and
 * entry_labels each need their own live query rather than one joined query: one for the
 * filtered/sorted/searched entries themselves (FROM entries - this also reacts to list
 * content edits, since those now bump the parent entry's updatedAt), one for every
 * entry-label association (FROM entry_labels) so a note's displayed labels stay live too.
 *
 * useLiveQuery's own effect only re-runs when its `deps` array changes (it defaults to
 * `[]`, i.e. "subscribe once, on mount"); without an explicit deps array here, it would
 * capture the very first render's query and never rebuild it as `filter`/`sort` change
 * while this screen stays mounted (unlike useListDetail, which only ever needs the
 * query it had on mount since a different list id mounts a whole new screen instance).
 */
export function useLibraryEntries(
  filter: LibraryFilter,
  sort: LibrarySort,
): LibraryEntryWithLabels[] {
  const entriesQuery = useLiveQuery(buildLibraryEntriesQuery(filter, sort, db), [
    filter.contentType,
    filter.labelId,
    filter.query,
    sort,
  ]);
  const labelLinksQuery = useLiveQuery(
    db
      .select({ entryId: entryLabels.entryId, label: labels })
      .from(entryLabels)
      .innerJoin(labels, eq(labels.id, entryLabels.labelId)),
  );

  return useMemo(() => {
    const labelsByEntryId = new Map<string, LabelRow[]>();
    for (const row of labelLinksQuery.data) {
      const existing = labelsByEntryId.get(row.entryId);
      if (existing) {
        existing.push(row.label);
      } else {
        labelsByEntryId.set(row.entryId, [row.label]);
      }
    }
    return entriesQuery.data.map((entry) => ({
      ...entry,
      labels: labelsByEntryId.get(entry.id) ?? [],
    }));
  }, [entriesQuery.data, labelLinksQuery.data]);
}
