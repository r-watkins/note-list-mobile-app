import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const timestampMs = (name: string) => integer(name, { mode: 'timestamp_ms' });

/**
 * IDs are not defaulted here (e.g. via $defaultFn) because expo-crypto transitively
 * imports react-native, which drizzle-kit's schema bundler cannot parse (Flow syntax).
 * Callers must generate IDs explicitly via src/lib/utils/id.ts before inserting.
 */

/** Shared top-level identity for every list and note (spec §8.1). */
export const entries = sqliteTable(
  'entries',
  {
    id: text('id').primaryKey(),
    entryType: text('entry_type', { enum: ['list', 'note'] }).notNull(),
    title: text('title').notNull(),
    archivedAt: timestampMs('archived_at'),
    createdAt: timestampMs('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestampMs('updated_at')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index('entries_entry_type_idx').on(table.entryType),
    index('entries_updated_at_idx').on(table.updatedAt),
    index('entries_title_nocase_idx').on(sql`${table.title} collate nocase`),
  ],
);

/** List-specific metadata. Minimal today; leaves room for list settings later. */
export const lists = sqliteTable('lists', {
  entryId: text('entry_id')
    .primaryKey()
    .references(() => entries.id, { onDelete: 'cascade' }),
});

export const sublists = sqliteTable(
  'sublists',
  {
    id: text('id').primaryKey(),
    listEntryId: text('list_entry_id')
      .notNull()
      .references(() => lists.entryId, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    sortOrder: real('sort_order').notNull(),
    createdAt: timestampMs('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestampMs('updated_at')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index('sublists_list_entry_id_sort_order_idx').on(table.listEntryId, table.sortOrder),
    index('sublists_title_nocase_idx').on(sql`${table.title} collate nocase`),
  ],
);

export const listItems = sqliteTable(
  'list_items',
  {
    id: text('id').primaryKey(),
    listEntryId: text('list_entry_id')
      .notNull()
      .references(() => lists.entryId, { onDelete: 'cascade' }),
    // null = item is at the root of its list, not inside a sublist.
    sublistId: text('sublist_id').references(() => sublists.id, { onDelete: 'cascade' }),
    itemType: text('item_type', { enum: ['checkbox', 'text'] }).notNull(),
    content: text('content').notNull(),
    // Only meaningful for item_type = 'checkbox'; stays false for text items.
    isChecked: integer('is_checked', { mode: 'boolean' }).notNull().default(false),
    sortOrder: real('sort_order').notNull(),
    createdAt: timestampMs('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestampMs('updated_at')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index('list_items_list_entry_id_sublist_id_sort_order_idx').on(
      table.listEntryId,
      table.sublistId,
      table.sortOrder,
    ),
    index('list_items_content_nocase_idx').on(sql`${table.content} collate nocase`),
  ],
);

export const notes = sqliteTable('notes', {
  entryId: text('entry_id')
    .primaryKey()
    .references(() => entries.id, { onDelete: 'cascade' }),
  bodyHtml: text('body_html').notNull().default(''),
  // Normalized, markup-free search projection derived whenever body_html changes.
  bodyPlainText: text('body_plain_text').notNull().default(''),
});

export const labels = sqliteTable('labels', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  // Trimmed, lowercase version of `name`; enforces case-insensitive uniqueness.
  normalizedName: text('normalized_name').notNull().unique(),
  createdAt: timestampMs('created_at')
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestampMs('updated_at')
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Named generically (not `note_labels`) to permit future list labeling without a migration redesign. */
export const entryLabels = sqliteTable(
  'entry_labels',
  {
    entryId: text('entry_id')
      .notNull()
      .references(() => entries.id, { onDelete: 'cascade' }),
    labelId: text('label_id')
      .notNull()
      .references(() => labels.id, { onDelete: 'cascade' }),
    createdAt: timestampMs('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.entryId, table.labelId] })],
);
