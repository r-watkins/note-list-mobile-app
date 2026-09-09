import type { SQLiteAsyncDatabase } from 'drizzle-orm/sqlite-core';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

/**
 * A drizzle db handle, an in-flight transaction, or (in tests) a better-sqlite3-backed
 * instance built from the same schema - repository/service functions accept any of them.
 * `TRunResult` is left as `any` deliberately: it only appears in `.run()`'s return type,
 * which no repository function reads, and each real driver uses its own incompatible
 * shape there (e.g. expo-sqlite's `lastInsertRowId` vs better-sqlite3's `lastInsertRowid`).
 */
export type DbClient = SQLiteAsyncDatabase<'sync', any>;

let realDb: DbClient | undefined;

function getRealDb(): DbClient {
  if (!realDb) {
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

    realDb = drizzle(expoDatabase);
  }
  return realDb;
}

/**
 * The app's real database, opened lazily on first use rather than at module load.
 * Repository/service functions reference this as their `executor` default param, and
 * merely importing this module (transitively, for the `DbClient` type) must not open a
 * real expo-sqlite connection - that native module doesn't exist under Jest/Node at all,
 * which is exactly what lets tests inject a better-sqlite3-backed DbClient instead
 * (design.md Decision #11) without this module crashing on import first.
 */
export const db: DbClient = new Proxy({} as DbClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getRealDb(), prop, receiver);
  },
});
