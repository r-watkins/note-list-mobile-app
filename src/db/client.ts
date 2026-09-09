import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

const expoDatabase = openDatabaseSync('pantry-list.db', { enableChangeListener: true });

// SQLite disables foreign key enforcement by default on every new connection;
// without this, the schema's `onDelete: 'cascade'` references are silently no-ops.
expoDatabase.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDatabase);

/** A drizzle db handle or an in-flight transaction - repository functions accept either. */
export type DbClient = typeof db | Parameters<Parameters<(typeof db)['transaction']>[0]>[0];
