import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

const expoDatabase = openDatabaseSync('pantry-list.db', { enableChangeListener: true });

export const db = drizzle(expoDatabase);
