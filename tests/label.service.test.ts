import { entries } from '@/db/schema';
import { getEntryLabelIds, getLabelById, listLabels } from '@/features/labels/label.repository';
import {
  createLabel,
  DuplicateLabelNameError,
  removeLabel,
  renameLabel,
  setEntryLabels,
} from '@/features/labels/label.service';

import { createTestDb } from './helpers/test-db';

function insertTestEntry(db: ReturnType<typeof createTestDb>, id: string) {
  const now = new Date();
  db.insert(entries)
    .values({ id, entryType: 'note', title: 'Test entry', createdAt: now, updatedAt: now })
    .run();
}

describe('createLabel', () => {
  it('creates a label with a trimmed name', () => {
    const db = createTestDb();
    const id = createLabel('  Dinner  ', db);
    expect(getLabelById(id, db)!.name).toBe('Dinner');
  });

  it('rejects a name that collides case-insensitively with an existing label', () => {
    const db = createTestDb();
    createLabel('Dinner', db);
    expect(() => createLabel('DINNER', db)).toThrow(DuplicateLabelNameError);
    expect(listLabels(db)).toHaveLength(1);
  });

  it('rejects a name that collides once trimmed, even with different surrounding whitespace', () => {
    const db = createTestDb();
    createLabel('Dinner', db);
    expect(() => createLabel('  dinner  ', db)).toThrow(DuplicateLabelNameError);
    expect(listLabels(db)).toHaveLength(1);
  });
});

describe('renameLabel', () => {
  it('renames a label', () => {
    const db = createTestDb();
    const id = createLabel('Dinner', db);
    renameLabel(id, 'Dinners', db);
    expect(getLabelById(id, db)!.name).toBe('Dinners');
  });

  it('allows renaming a label to its own current name (no false collision)', () => {
    const db = createTestDb();
    const id = createLabel('Dinner', db);
    expect(() => renameLabel(id, 'Dinner', db)).not.toThrow();
  });

  it('rejects renaming to a name that collides with a different label', () => {
    const db = createTestDb();
    createLabel('Dinner', db);
    const id = createLabel('Breakfast', db);
    expect(() => renameLabel(id, 'dinner', db)).toThrow(DuplicateLabelNameError);
  });
});

describe('removeLabel', () => {
  it('deletes the label and its entry associations', () => {
    const db = createTestDb();
    const id = createLabel('Dinner', db);
    insertTestEntry(db, 'entry-1');
    setEntryLabels('entry-1', [id], db);

    removeLabel(id, db);

    expect(getLabelById(id, db)).toBeUndefined();
    expect(getEntryLabelIds('entry-1', db)).toEqual([]);
  });
});

describe('setEntryLabels', () => {
  it("replaces an entry's label associations with exactly the given set", () => {
    const db = createTestDb();
    const dinner = createLabel('Dinner', db);
    const pasta = createLabel('Pasta', db);
    const dessert = createLabel('Dessert', db);
    insertTestEntry(db, 'entry-1');
    setEntryLabels('entry-1', [dinner, pasta], db);

    setEntryLabels('entry-1', [pasta, dessert], db);

    expect(new Set(getEntryLabelIds('entry-1', db))).toEqual(new Set([pasta, dessert]));
  });

  it('is a no-op when the given set already matches', () => {
    const db = createTestDb();
    const dinner = createLabel('Dinner', db);
    insertTestEntry(db, 'entry-1');
    setEntryLabels('entry-1', [dinner], db);

    expect(() => setEntryLabels('entry-1', [dinner], db)).not.toThrow();
    expect(getEntryLabelIds('entry-1', db)).toEqual([dinner]);
  });
});
