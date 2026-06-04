import type { InferInsertModel, InferSelectModel, Table } from 'drizzle-orm';
import type { schema as pgSchema } from './adapters/pg';

export type AppSchema = {
  [K in keyof typeof pgSchema]: Table & {
    $inferSelect: InferSelectModel<typeof pgSchema[K]>;
    $inferInsert: InferInsertModel<typeof pgSchema[K]>;
  };
};

export type Select<K extends keyof typeof pgSchema> = InferSelectModel<typeof pgSchema[K]>;
export type Insert<K extends keyof typeof pgSchema> = InferInsertModel<typeof pgSchema[K]>;
