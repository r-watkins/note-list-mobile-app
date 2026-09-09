import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import type { DbClient } from '@/db/client';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'src', 'db', 'migrations');

/**
 * Applies every generated migration (in order) to a raw better-sqlite3 connection.
 * Reads directly from src/db/migrations rather than duplicating schema.ts's CREATE
 * TABLE statements by hand, so the test schema can never drift from the real one.
 */
function applyMigrations(sqlite: Database.Database): void {
  const migrationDirs = fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const dir of migrationDirs) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, dir, 'migration.sql'), 'utf8');
    sqlite.exec(sql);
  }
}

/**
 * Builds a fresh, schema-seeded, in-memory database for tests (design.md Decision #11).
 * A real SQLite engine (better-sqlite3), not a mock - swapped in for expo-sqlite, which
 * has no Jest mock and cannot run under Node at all. The returned handle satisfies the
 * same `DbClient` type every repository/service function's `executor` param accepts, so
 * tests exercise the exact same code as the app.
 */
export function createTestDb(): DbClient {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  applyMigrations(sqlite);
  return drizzle({ client: sqlite });
}
