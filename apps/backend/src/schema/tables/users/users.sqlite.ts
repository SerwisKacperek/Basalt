import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { timestamps } from "../../base/timestamps/timestamps.sqlite";

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text('email').unique(),
    password: text("password").notNull(),
    ...timestamps,
  }
);
