import { schema as pgSchema } from '@basalt/domain/schema/pg';
import { schema as sqliteSchema } from '@basalt/domain/schema/sqlite';

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
