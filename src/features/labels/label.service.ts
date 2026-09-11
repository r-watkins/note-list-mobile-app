import { db, type DbClient } from '@/db/client';
import {
  deleteEntryLabel,
  deleteLabel,
  getEntryLabelIds,
  getLabelByNormalizedName,
  insertEntryLabel,
  insertLabel,
  normalizeLabelName,
  updateLabelName,
} from '@/features/labels/label.repository';
import { generateId } from '@/lib/id';

/** Thrown when a label name collides (case-insensitively) with an existing label. */
export class DuplicateLabelNameError extends Error {
  constructor(name: string) {
    super(`A label named "${name}" already exists.`);
    this.name = 'DuplicateLabelNameError';
  }
}

/**
 * Creates a label, enforcing case-insensitive name uniqueness (spec §6.3) with an explicit
 * pre-check inside the transaction (not just relying on the DB's own unique index) so
 * callers get a typed DuplicateLabelNameError instead of a raw SQLITE_CONSTRAINT error to
 * parse. Returns the new label's id.
 */
export function createLabel(name: string, executor: DbClient = db): string {
  const id = generateId();
  const now = new Date();
  const normalizedName = normalizeLabelName(name);

  executor.transaction((tx) => {
    if (getLabelByNormalizedName(normalizedName, tx)) {
      throw new DuplicateLabelNameError(name);
    }
    insertLabel({ id, name: name.trim(), now }, tx);
  });

  return id;
}

/** Renames a label, enforcing the same case-insensitive uniqueness as createLabel. */
export function renameLabel(id: string, name: string, executor: DbClient = db): void {
  const now = new Date();
  const normalizedName = normalizeLabelName(name);

  executor.transaction((tx) => {
    const existing = getLabelByNormalizedName(normalizedName, tx);
    if (existing && existing.id !== id) {
      throw new DuplicateLabelNameError(name);
    }
    updateLabelName(id, name.trim(), now, tx);
  });
}

export function removeLabel(id: string, executor: DbClient = db): void {
  executor.transaction((tx) => {
    deleteLabel(id, tx);
  });
}

/**
 * Replaces an entry's full set of label associations in one transaction (spec §9.3) -
 * removes associations no longer present in `labelIds` and adds any new ones. Used by the
 * note editor's label-assignment UI, which always submits the complete desired set.
 */
export function setEntryLabels(entryId: string, labelIds: string[], executor: DbClient = db): void {
  const now = new Date();
  const desired = new Set(labelIds);

  executor.transaction((tx) => {
    const current = new Set(getEntryLabelIds(entryId, tx));
    for (const labelId of current) {
      if (!desired.has(labelId)) {
        deleteEntryLabel(entryId, labelId, tx);
      }
    }
    for (const labelId of desired) {
      if (!current.has(labelId)) {
        insertEntryLabel(entryId, labelId, now, tx);
      }
    }
  });
}
