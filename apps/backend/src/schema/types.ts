import type { InferInsertModel, InferSelectModel, Table } from 'drizzle-orm';
import type { schema as pgSchema } from './adapters/pg';

export type AppSchema = {
  [K in keyof typeof pgSchema]: Table & {
    $inferSelect: InferSelectModel<typeof pgSchema[K]>;
    $inferInsert: InferInsertModel<typeof pgSchema[K]>;
  };
};
