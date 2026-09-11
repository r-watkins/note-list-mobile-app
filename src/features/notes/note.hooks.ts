import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '@/db/client';
import { entries, entryLabels, labels, notes } from '@/db/schema';
import type { NoteEntryRow } from '@/features/notes/note.repository';

export type NoteLabelRow = typeof labels.$inferSelect;
export type NoteBodyRow = typeof notes.$inferSelect;

export type NoteDetail = {
  entry: NoteEntryRow | undefined;
  note: NoteBodyRow | undefined;
  labels: NoteLabelRow[];
};

/**
 * Reactive note read, composed from separate useLiveQuery calls per table - same reason
 * as list.hooks.ts's useListDetail (the expo-sqlite driver only re-runs a query when its
 * own FROM table changes, so one query per table is how this driver is meant to be used).
 */
export function useNoteDetail(entryId: string): NoteDetail {
  const entryQuery = useLiveQuery(db.select().from(entries).where(eq(entries.id, entryId)));
  const noteQuery = useLiveQuery(db.select().from(notes).where(eq(notes.entryId, entryId)));
  const labelsQuery = useLiveQuery(
    db
      .select({ label: labels })
      .from(entryLabels)
      .innerJoin(labels, eq(labels.id, entryLabels.labelId))
      .where(eq(entryLabels.entryId, entryId)),
  );

  return {
    entry: entryQuery.data[0],
    note: noteQuery.data[0],
    labels: labelsQuery.data.map((row) => row.label),
  };
}
