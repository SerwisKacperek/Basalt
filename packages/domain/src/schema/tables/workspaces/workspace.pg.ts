import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";

import { timestamps } from "../../base/timestamps/timestamps.pg";

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    name: varchar({ length: 255 }).notNull(),
    type: text('type'),
    url: text('url'),
    ...timestamps,
  }
);
