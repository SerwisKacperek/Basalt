import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from 'pg';

import { schema } from "@basalt/domain/schema/pg";

export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}

export type Db = ReturnType<typeof createDb>;
