import { generateId } from '@/lib/id';

import { db } from './client';
import { entries, entryLabels, labels, listItems, lists, notes, sublists } from './schema';

/**
 * Dev-only performance stress data (spec §13: "remain responsive with at least several
 * hundred lists/notes and several thousand list items"). Distinct from seedDatabase()
 * (src/db/seed.ts), which seeds a small, realistic demo dataset - this generates a much
 * larger, synthetic one purely to exercise Library's FlashList and the list detail screen's
 * rendering under real-world-scale load (Task 52).
 */
const REGULAR_LIST_COUNT = 200;
const NOTE_COUNT = 150;
/** A single list with this many root items - the "long list view" stress case. */
const STRESS_LIST_ITEM_COUNT = 2000;
/** Keeps a single INSERT's bound-parameter count safely under SQLite's default limit (999). */
const INSERT_CHUNK_SIZE = 100;

const GROCERY_ITEM_NAMES = [
  'Milk',
  'Eggs',
  'Bread',
  'Butter',
  'Apples',
  'Bananas',
  'Rice',
  'Pasta',
  'Coffee',
  'Tea',
  'Cheese',
  'Yogurt',
  'Spinach',
  'Onions',
  'Garlic',
  'Chicken',
  'Ground beef',
  'Salmon',
  'Olive oil',
  'Salt',
];

const LABEL_NAMES = ['Perf Test', 'Recipe', 'Reference', 'Draft', 'Archive'];

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Runs perfSeeded on the app's real database; returns row counts actually inserted. */
export function seedPerfData(): {
  seeded: boolean;
  entryCount: number;
  listItemCount: number;
} {
  const existing = db.select({ id: entries.id }).from(entries).limit(1).all();
  if (existing.length > 0) {
    return { seeded: false, entryCount: 0, listItemCount: 0 };
  }

  const now = new Date();
  let entryCount = 0;
  let listItemCount = 0;

  db.transaction((tx) => {
    // Regular-sized lists: a mix of root items and sublists, like a real user's lists.
    for (let listIndex = 0; listIndex < REGULAR_LIST_COUNT; listIndex++) {
      const entryId = generateId();
      tx.insert(entries)
        .values({
          id: entryId,
          entryType: 'list',
          title: `Perf List ${listIndex + 1}`,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      tx.insert(lists).values({ entryId }).run();
      entryCount++;

      const rootItems = Array.from({ length: 3 }, (_, itemIndex) => ({
        id: generateId(),
        listEntryId: entryId,
        sublistId: null,
        itemType: 'checkbox' as const,
        content: GROCERY_ITEM_NAMES[(listIndex + itemIndex) % GROCERY_ITEM_NAMES.length],
        sortOrder: itemIndex,
        createdAt: now,
        updatedAt: now,
      }));
      tx.insert(listItems).values(rootItems).run();
      listItemCount += rootItems.length;

      for (let sublistIndex = 0; sublistIndex < 2; sublistIndex++) {
        const sublistId = generateId();
        tx.insert(sublists)
          .values({
            id: sublistId,
            listEntryId: entryId,
            title: sublistIndex === 0 ? 'Aisle A' : 'Aisle B',
            sortOrder: sublistIndex,
            createdAt: now,
            updatedAt: now,
          })
          .run();

        const sublistItems = Array.from({ length: 4 }, (_, itemIndex) => ({
          id: generateId(),
          listEntryId: entryId,
          sublistId,
          itemType: 'checkbox' as const,
          content:
            GROCERY_ITEM_NAMES[(listIndex + sublistIndex + itemIndex) % GROCERY_ITEM_NAMES.length],
          sortOrder: itemIndex,
          createdAt: now,
          updatedAt: now,
        }));
        tx.insert(listItems).values(sublistItems).run();
        listItemCount += sublistItems.length;
      }
    }

    // One deliberately huge, flat list - the "long list view" stress case spec §13 calls
    // out by name, exercising the list detail screen's own rendering independent of Library.
    const stressEntryId = generateId();
    tx.insert(entries)
      .values({
        id: stressEntryId,
        entryType: 'list',
        title: `Stress Test List (${STRESS_LIST_ITEM_COUNT} items)`,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    tx.insert(lists).values({ entryId: stressEntryId }).run();
    entryCount++;

    const stressItems = Array.from({ length: STRESS_LIST_ITEM_COUNT }, (_, itemIndex) => ({
      id: generateId(),
      listEntryId: stressEntryId,
      sublistId: null,
      itemType: 'checkbox' as const,
      content: `${GROCERY_ITEM_NAMES[itemIndex % GROCERY_ITEM_NAMES.length]} #${itemIndex + 1}`,
      sortOrder: itemIndex,
      createdAt: now,
      updatedAt: now,
    }));
    for (const batch of chunk(stressItems, INSERT_CHUNK_SIZE)) {
      tx.insert(listItems).values(batch).run();
    }
    listItemCount += stressItems.length;

    // Notes: a handful of shared labels, reused across notes (same shape as real usage).
    const labelIds = LABEL_NAMES.map((name) => {
      const id = generateId();
      tx.insert(labels)
        .values({ id, name, normalizedName: name.toLowerCase(), createdAt: now, updatedAt: now })
        .run();
      return id;
    });

    for (let noteIndex = 0; noteIndex < NOTE_COUNT; noteIndex++) {
      const entryId = generateId();
      const bodyText = `Note body content for perf note ${noteIndex + 1}. Lorem ipsum dolor sit amet.`;
      tx.insert(entries)
        .values({
          id: entryId,
          entryType: 'note',
          title: `Perf Note ${noteIndex + 1}`,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      tx.insert(notes)
        .values({ entryId, bodyHtml: `<p>${bodyText}</p>`, bodyPlainText: bodyText })
        .run();
      entryCount++;

      const labelId = labelIds[noteIndex % labelIds.length];
      tx.insert(entryLabels).values({ entryId, labelId, createdAt: now }).run();
    }
  });

  return { seeded: true, entryCount, listItemCount };
}
