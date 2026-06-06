import type { BundledMigration } from "./migrations-bundle";

/** Splits a drizzle-kit migration file into individual SQL statements. */
export function splitSqlStatements(sql: string): string[] {
  return sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Structural subset of a better-sqlite3 Database, so this package does not need
// to depend on better-sqlite3 (or its types).
interface SqliteRunner {
  exec(sql: string): unknown;
  prepare(sql: string): {
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
  transaction(fn: () => void): (...args: unknown[]) => unknown;
}

/**
 * Applies pending migrations to a synchronous (better-sqlite3) connection,
 * tracking what has run in `__drizzle_migrations`. fs-free so it works in a
 * bundled / packaged Electron app.
 */
export function applyMigrations(
  db: SqliteRunner,
  migrations: BundledMigration[],
): void {
  db.exec(
    `CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );`,
  );
  const has = db.prepare("SELECT 1 FROM __drizzle_migrations WHERE tag = ?");
  const insert = db.prepare(
    "INSERT INTO __drizzle_migrations (tag, created_at) VALUES (?, ?)",
  );
  for (const migration of migrations) {
    if (has.get(migration.tag)) continue;
    const statements = splitSqlStatements(migration.sql);
    db.transaction(() => {
      for (const statement of statements) db.exec(statement);
      insert.run(migration.tag, Date.now());
    })();
  }
}

/**
 * Drops every user table (including the migration ledger) and re-applies the
 * schema from scratch. Used by the "rebuild database" action to recover from a
 * corrupt or stale local database.
 */
export function resetDatabase(
  db: SqliteRunner,
  migrations: BundledMigration[],
): void {
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    )
    .all() as { name: string }[];
  db.exec("PRAGMA foreign_keys = OFF;");
  for (const { name } of tables) db.exec(`DROP TABLE IF EXISTS "${name}";`);
  db.exec("PRAGMA foreign_keys = ON;");
  applyMigrations(db, migrations);
}
