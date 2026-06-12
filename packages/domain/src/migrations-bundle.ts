import journal from "../migrations/meta/_journal.json";

const sqlFiles = import.meta.glob("../migrations/*.sql", {
  query: "?raw",
  eager: true,
  import: "default",
}) as Record<string, string>;

export interface BundledMigration {
  tag: string;
  sql: string;
}

/** Migrations in journal (apply) order. */
export const migrations: BundledMigration[] = [...journal.entries]
  .sort((a, b) => a.idx - b.idx)
  .map((entry) => {
    const key = `../migrations/${entry.tag}.sql`;
    const sql = sqlFiles[key];
    if (sql === undefined) {
      throw new Error(`Missing migration SQL for "${entry.tag}"`);
    }
    return { tag: entry.tag, sql };
  });
