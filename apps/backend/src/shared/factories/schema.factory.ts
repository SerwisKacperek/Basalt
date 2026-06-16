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

let _schema: Schema | undefined;

export const schema: Schema = new Proxy({} as Schema, {
  get(_, key) {
    if (!_schema) _schema = getSchema();
    return (_schema as any)[key];
  },
  has(_, key) {
    if (!_schema) _schema = getSchema();
    return key in _schema;
  },
  ownKeys() {
    if (!_schema) _schema = getSchema();
    return Reflect.ownKeys(_schema);
  },
  getOwnPropertyDescriptor(_, key) {
    if (!_schema) _schema = getSchema();
    return Reflect.getOwnPropertyDescriptor(_schema, key);
  },
});

export default schema;
