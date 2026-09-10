import { and, asc, desc, eq, exists, inArray, or, sql } from 'drizzle-orm';

import { db, type DbClient } from '@/db/client';
import { entries, entryLabels, labels, listItems, sublists } from '@/db/schema';

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
  /**
   * Case-insensitive substring search (spec §8.3) - trimmed; empty/omitted matches
   * everything (spec: "an empty query shows the normal filtered/sorted entry list").
   * Does not search `notes.body_plain_text` - spec §8.3 marks that column optional and
   * design.md's Task 31 scope covers only `entries.title`/`sublists.title`/
   * `list_items.content` for lists and `entries.title`/`labels.name` for notes.
   */
  query?: string;
};

/** Escapes LIKE's special characters so they are matched literally, not as wildcards. */
function escapeLikeSpecialChars(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function likePattern(query: string): string {
  return `%${escapeLikeSpecialChars(query)}%`;
}

/**
 * Spec §8.3's search predicate: a list matches on its own title, any of its sublists'
 * titles, or any of its items' content; a note matches on its own title or any label
 * attached to it. Always parameterized - drizzle binds `pattern` as a query parameter,
 * so user search text is never interpolated directly into the SQL string - and the
 * pattern itself has `%`/`_`/`\` escaped so the user's text can't inject LIKE wildcards.
 */
function searchCondition(query: string, executor: DbClient) {
  const pattern = likePattern(query);
  const titleMatch = sql`${entries.title} LIKE ${pattern} ESCAPE '\\'`;

  const sublistMatch = exists(
    executor
      .select({ one: sql`1` })
      .from(sublists)
      .where(
        and(
          eq(sublists.listEntryId, entries.id),
          sql`${sublists.title} LIKE ${pattern} ESCAPE '\\'`,
        ),
      ),
  );
  const itemMatch = exists(
    executor
      .select({ one: sql`1` })
      .from(listItems)
      .where(
        and(
          eq(listItems.listEntryId, entries.id),
          sql`${listItems.content} LIKE ${pattern} ESCAPE '\\'`,
        ),
      ),
  );
  const labelMatch = exists(
    executor
      .select({ one: sql`1` })
      .from(entryLabels)
      .innerJoin(labels, eq(labels.id, entryLabels.labelId))
      .where(
        and(eq(entryLabels.entryId, entries.id), sql`${labels.name} LIKE ${pattern} ESCAPE '\\'`),
      ),
  );

  return or(
    and(eq(entries.entryType, 'list'), or(titleMatch, sublistMatch, itemMatch)),
    and(eq(entries.entryType, 'note'), or(titleMatch, labelMatch)),
  );
}

/** Labels only ever attach to notes in MVP - filtering by label id is a plain membership check. */
function labelFilterCondition(labelId: string, executor: DbClient) {
  return exists(
    executor
      .select({ one: sql`1` })
      .from(entryLabels)
      .where(and(eq(entryLabels.entryId, entries.id), eq(entryLabels.labelId, labelId))),
  );
}

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
 * The entries query underlying getLibraryEntries, exposed unexecuted so
 * useLibraryEntries (library.hooks.ts) can feed it straight to useLiveQuery. Always a
 * plain `select().from(entries)` - filtering by label uses an EXISTS subquery rather
 * than a JOIN specifically so the query's shape (and its FROM table, which is what
 * expo-sqlite's useLiveQuery watches for reactivity) never changes across filter states.
 */
export function buildLibraryEntriesQuery(
  filter: LibraryFilter,
  sort: LibrarySort,
  executor: DbClient = db,
) {
  const effectiveType: LibraryContentTypeFilter =
    filter.labelId !== undefined ? 'note' : filter.contentType;
  const typeCondition = effectiveType === 'all' ? undefined : eq(entries.entryType, effectiveType);

  const trimmedQuery = filter.query?.trim();
  const searchMatch = trimmedQuery ? searchCondition(trimmedQuery, executor) : undefined;
  const labelMatch =
    filter.labelId !== undefined ? labelFilterCondition(filter.labelId, executor) : undefined;

  return executor
    .select()
    .from(entries)
    .where(and(typeCondition, labelMatch, searchMatch))
    .orderBy(...sortColumns(sort));
}

/**
 * Unified list+note entries matching the content-type/label/search filter, in the
 * requested sort order (spec §7.3, §8.3).
 */
export function getLibraryEntries(
  filter: LibraryFilter,
  sort: LibrarySort,
  executor: DbClient = db,
): LibraryEntryWithLabels[] {
  const entryRows = buildLibraryEntriesQuery(filter, sort, executor).all();

  const labelsByEntryId = getLabelsByEntryId(
    entryRows.map((entry) => entry.id),
    executor,
  );

  return entryRows.map((entry) => ({ ...entry, labels: labelsByEntryId.get(entry.id) ?? [] }));
}
