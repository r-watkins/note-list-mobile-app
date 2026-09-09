import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

const expoDatabase = openDatabaseSync('pantry-list.db', { enableChangeListener: true });

// SQLite disables foreign key enforcement by default on every new connection;
// without this, the schema's `onDelete: 'cascade'` references are silently no-ops.
expoDatabase.execSync('PRAGMA foreign_keys = ON;');
// Without this, every db.transaction() call failed at commit with
// "Error code: database is locked" (SQLITE_LOCKED) - reproduced consistently across
// fresh app relaunches, so not a stale-connection/dev-reload artifact. The default
// rollback-journal mode requires an exclusive lock to commit a write transaction;
// WAL lets readers and a writer coexist instead, and is the generally-recommended
// mode for a single-writer mobile app regardless.
expoDatabase.execSync('PRAGMA journal_mode = WAL;');

export const db = drizzle(expoDatabase);

/** A drizzle db handle or an in-flight transaction - repository functions accept either. */
export type DbClient = typeof db | Parameters<Parameters<(typeof db)['transaction']>[0]>[0];
