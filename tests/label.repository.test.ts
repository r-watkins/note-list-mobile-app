import {
  deleteEntryLabel,
  deleteLabel,
  getEntryLabelIds,
  getLabelByNormalizedName,
  getLabelById,
  insertEntryLabel,
  insertLabel,
  listLabels,
  normalizeLabelName,
  updateLabelName,
} from '@/features/labels/label.repository';
import { entries } from '@/db/schema';
import { generateId } from '@/lib/id';

import { createTestDb } from './helpers/test-db';

function insertTestLabel(db: ReturnType<typeof createTestDb>, name: string, now = new Date()) {
  const id = generateId();
  insertLabel({ id, name, now }, db);
  return id;
}

/** entry_labels.entry_id has a foreign key to entries - associations need a real row to attach to. */
function insertTestEntry(db: ReturnType<typeof createTestDb>, id: string) {
  const now = new Date();
  db.insert(entries)
    .values({ id, entryType: 'note', title: 'Test entry', createdAt: now, updatedAt: now })
    .run();
}

describe('normalizeLabelName', () => {
  it('trims and lowercases', () => {
    expect(normalizeLabelName('  Dinner  ')).toBe('dinner');
  });
});

describe('insertLabel / getLabelById / getLabelByNormalizedName', () => {
  it('persists a label with its normalized name derived from the given name', () => {
    const db = createTestDb();
    const id = insertTestLabel(db, 'Dinner');

    const label = getLabelById(id, db)!;
    expect(label.name).toBe('Dinner');
    expect(label.normalizedName).toBe('dinner');
    expect(getLabelByNormalizedName('dinner', db)!.id).toBe(id);
  });
});

describe('listLabels', () => {
  it('returns every label alphabetically, case-insensitively', () => {
    const db = createTestDb();
    insertTestLabel(db, 'zebra');
    insertTestLabel(db, 'Apple');
    insertTestLabel(db, 'banana');

    expect(listLabels(db).map((label) => label.name)).toEqual(['Apple', 'banana', 'zebra']);
  });
});

describe('updateLabelName', () => {
  it('updates name and normalized_name together and bumps updatedAt', () => {
    const db = createTestDb();
    const id = insertTestLabel(db, 'Dinner', new Date(1000));

    updateLabelName(id, 'Dinners', new Date(2000), db);

    const label = getLabelById(id, db)!;
    expect(label.name).toBe('Dinners');
    expect(label.normalizedName).toBe('dinners');
    expect(label.updatedAt.getTime()).toBe(2000);
  });
});

describe('deleteLabel', () => {
  it('cascades to remove entry_labels associations', () => {
    const db = createTestDb();
    const labelId = insertTestLabel(db, 'Dinner');
    insertTestEntry(db, 'entry-1');
    insertEntryLabel('entry-1', labelId, new Date(), db);

    deleteLabel(labelId, db);

    expect(getLabelById(labelId, db)).toBeUndefined();
    expect(getEntryLabelIds('entry-1', db)).toEqual([]);
  });
});

describe('insertEntryLabel / deleteEntryLabel / getEntryLabelIds', () => {
  it('attaches and detaches a label from an entry independently of other associations', () => {
    const db = createTestDb();
    const labelA = insertTestLabel(db, 'Dinner');
    const labelB = insertTestLabel(db, 'Pasta');
    insertTestEntry(db, 'entry-1');
    insertEntryLabel('entry-1', labelA, new Date(), db);
    insertEntryLabel('entry-1', labelB, new Date(), db);

    deleteEntryLabel('entry-1', labelA, db);

    expect(getEntryLabelIds('entry-1', db)).toEqual([labelB]);
  });
});
