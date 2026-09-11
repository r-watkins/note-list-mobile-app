import { asc, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '@/db/client';
import { labels } from '@/db/schema';
import type { LabelRow } from '@/features/labels/label.repository';

/** All labels, alphabetically (case-insensitive) - reactive equivalent of listLabels(). */
export function useLabels(): LabelRow[] {
  const query = useLiveQuery(
    db
      .select()
      .from(labels)
      .orderBy(asc(sql`${labels.name} collate nocase`)),
  );
  return query.data;
}
