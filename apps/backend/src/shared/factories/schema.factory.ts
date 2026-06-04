import { schema as pgSchema } from '../../schema/adapters/pg';
import { schema as sqliteSchema } from '../../schema/adapters/sqlite';

// Keep postgres schema as canonical typing for callers.
export type Schema = typeof pgSchema;

export function getSchema(): Schema {
  const dialect = process.env.DB_DIALECT ?? 'postgresql';

  if (dialect === 'sqlite') {
    return sqliteSchema as unknown as Schema;
  }

  return pgSchema;
}

export const schema = getSchema();

export default schema;
