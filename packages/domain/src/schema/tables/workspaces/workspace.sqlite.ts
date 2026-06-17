import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { timestamps } from "../../base/timestamps/timestamps.sqlite";

export const workspaces = sqliteTable(
  'workspaces',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    type: text('type', { enum: ['local', 'remote'] }).notNull().default('local'),
    url: text('url'),
    ...timestamps,
  }
);
