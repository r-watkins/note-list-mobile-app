import { generateId } from '@/lib/id';

import { db } from './client';
import { entries, entryLabels, labels, listItems, lists, notes, sublists } from './schema';

const GROCERY_SUBLISTS: { title: string; items: string[] }[] = [
  { title: 'Dairy', items: ['Milk', 'Butter', 'Eggs', 'Greek yogurt'] },
  { title: 'Produce', items: ['Bananas', 'Spinach', 'Yellow onions'] },
  { title: 'Meats', items: ['Chicken breast', 'Ground turkey'] },
  { title: 'Grains', items: ['Rice', 'Whole wheat bread'] },
];

const GROCERY_ROOT_ITEMS = ['Trash bags', 'Dish soap'];

const SAMPLE_NOTES: { title: string; labelNames: string[]; bodyHtml: string }[] = [
  {
    title: 'Weeknight Turkey Pasta',
    labelNames: ['Dinner', 'Pasta', 'High Protein'],
    bodyHtml:
      '<h2>Ingredients</h2><ul><li>1 lb ground turkey</li><li>12 oz pasta</li>' +
      '<li>1 jar marinara sauce</li><li>2 cloves garlic, minced</li>' +
      '<li>Grated parmesan, to taste</li></ul><h2>Instructions</h2>' +
      '<ol><li>Boil pasta according to package directions.</li>' +
      '<li>Brown the turkey with garlic in a large skillet over medium heat.</li>' +
      '<li>Stir in the marinara sauce and simmer for 5 minutes.</li>' +
      '<li>Toss with the drained pasta and top with parmesan.</li></ol>' +
      '<p><strong>Total time:</strong> about 25 minutes.</p>',
  },
  {
    title: 'Easy Overnight Oats',
    labelNames: ['Breakfast', 'Meal Prep'],
    bodyHtml:
      '<h2>Ingredients</h2><ul><li>1/2 cup rolled oats</li><li>1/2 cup milk</li>' +
      '<li>1/4 cup Greek yogurt</li><li>1 tsp honey</li><li>Fresh berries, to top</li></ul>' +
      '<h2>Instructions</h2><ol><li>Combine oats, milk, yogurt, and honey in a jar.</li>' +
      '<li>Stir well, cover, and refrigerate overnight.</li>' +
      '<li>Top with fresh berries before eating.</li></ol>' +
      '<p><em>Keeps in the fridge for up to 3 days.</em></p>',
  },
];

// Minimal strip-tags helper for this dev-only seed content, not a general sanitizer.
// Task 40 owns the real body_plain_text derivation used by the note save flow.
function stripToPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Dev-only seed data (spec §14): the sample Grocery List and sample notes, used to verify
 * list hierarchy, searching nested content, note labels, and rich-text rendering.
 * Skips seeding if any entries already exist, so repeated triggers don't duplicate data.
 */
export function seedDatabase(): { seeded: boolean } {
  const existing = db.select({ id: entries.id }).from(entries).limit(1).all();
  if (existing.length > 0) {
    return { seeded: false };
  }

  db.transaction((tx) => {
    const groceryListEntryId = generateId();
    const now = new Date();

    tx.insert(entries)
      .values({
        id: groceryListEntryId,
        entryType: 'list',
        title: 'Grocery List',
        createdAt: now,
        updatedAt: now,
      })
      .run();
    tx.insert(lists).values({ entryId: groceryListEntryId }).run();

    GROCERY_SUBLISTS.forEach((sublist, sublistIndex) => {
      const sublistId = generateId();
      tx.insert(sublists)
        .values({
          id: sublistId,
          listEntryId: groceryListEntryId,
          title: sublist.title,
          sortOrder: sublistIndex,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      sublist.items.forEach((content, itemIndex) => {
        tx.insert(listItems)
          .values({
            id: generateId(),
            listEntryId: groceryListEntryId,
            sublistId,
            itemType: 'checkbox',
            content,
            sortOrder: itemIndex,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      });
    });

    GROCERY_ROOT_ITEMS.forEach((content, itemIndex) => {
      tx.insert(listItems)
        .values({
          id: generateId(),
          listEntryId: groceryListEntryId,
          sublistId: null,
          itemType: 'checkbox',
          content,
          sortOrder: itemIndex,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    });

    const labelIdsByNormalizedName = new Map<string, string>();

    SAMPLE_NOTES.forEach((note) => {
      const noteEntryId = generateId();
      tx.insert(entries)
        .values({
          id: noteEntryId,
          entryType: 'note',
          title: note.title,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      tx.insert(notes)
        .values({
          entryId: noteEntryId,
          bodyHtml: note.bodyHtml,
          bodyPlainText: stripToPlainText(note.bodyHtml),
        })
        .run();

      note.labelNames.forEach((labelName) => {
        const normalizedName = labelName.trim().toLowerCase();
        let labelId = labelIdsByNormalizedName.get(normalizedName);
        if (!labelId) {
          labelId = generateId();
          tx.insert(labels)
            .values({
              id: labelId,
              name: labelName,
              normalizedName,
              createdAt: now,
              updatedAt: now,
            })
            .run();
          labelIdsByNormalizedName.set(normalizedName, labelId);
        }
        tx.insert(entryLabels).values({ entryId: noteEntryId, labelId, createdAt: now }).run();
      });
    });
  });

  return { seeded: true };
}
