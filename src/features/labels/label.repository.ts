import { and, asc, eq, sql } from 'drizzle-orm';

import { db, type DbClient } from '@/db/client';
import { entryLabels, labels } from '@/db/schema';

export type LabelRow = typeof labels.$inferSelect;

/** Trims and lowercases a label name - the value stored in `normalized_name`. */
export function normalizeLabelName(name: string): string {
  return name.trim().toLowerCase();
}

/** All labels, alphabetically (case-insensitive) - for the Label Manager and assignment UI. */
export function listLabels(executor: DbClient = db): LabelRow[] {
  return executor
    .select()
    .from(labels)
    .orderBy(asc(sql`${labels.name} collate nocase`))
    .all();
}

export function getLabelById(id: string, executor: DbClient = db): LabelRow | undefined {
  return executor.select().from(labels).where(eq(labels.id, id)).get();
}

/** Looks up a label by its normalized name - the pre-check behind case-insensitive uniqueness. */
export function getLabelByNormalizedName(
  normalizedName: string,
  executor: DbClient = db,
): LabelRow | undefined {
  return executor.select().from(labels).where(eq(labels.normalizedName, normalizedName)).get();
}

export type InsertLabelInput = { id: string; name: string; now: Date };

export function insertLabel(input: InsertLabelInput, executor: DbClient = db): void {
  executor
    .insert(labels)
    .values({
      id: input.id,
      name: input.name,
      normalizedName: normalizeLabelName(input.name),
      createdAt: input.now,
      updatedAt: input.now,
    })
    .run();
}

export function updateLabelName(
  id: string,
  name: string,
  now: Date,
  executor: DbClient = db,
): void {
  executor
    .update(labels)
    .set({ name, normalizedName: normalizeLabelName(name), updatedAt: now })
    .where(eq(labels.id, id))
    .run();
}

/** Deletes the label; `onDelete: 'cascade'` removes its `entry_labels` associations. */
export function deleteLabel(id: string, executor: DbClient = db): void {
  executor.delete(labels).where(eq(labels.id, id)).run();
}

/** Label ids currently attached to an entry (only notes have any, in MVP). */
export function getEntryLabelIds(entryId: string, executor: DbClient = db): string[] {
  return executor
    .select({ labelId: entryLabels.labelId })
    .from(entryLabels)
    .where(eq(entryLabels.entryId, entryId))
    .all()
    .map((row) => row.labelId);
}

export function insertEntryLabel(
  entryId: string,
  labelId: string,
  now: Date,
  executor: DbClient = db,
): void {
  executor.insert(entryLabels).values({ entryId, labelId, createdAt: now }).run();
}

export function deleteEntryLabel(entryId: string, labelId: string, executor: DbClient = db): void {
  executor
    .delete(entryLabels)
    .where(and(eq(entryLabels.entryId, entryId), eq(entryLabels.labelId, labelId)))
    .run();
}
