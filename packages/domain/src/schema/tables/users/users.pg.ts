import { sql } from "drizzle-orm";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";

import { timestamps } from "../../base/timestamps/timestamps.pg";

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    email: text('email').unique(),
    password: text("password").notNull(),
    ...timestamps,
  }
);
