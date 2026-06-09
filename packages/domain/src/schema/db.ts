import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { schema as pgSchema } from './adapters/pg';

export type Db = NodePgDatabase<typeof pgSchema>;
export type Schema = typeof pgSchema;
