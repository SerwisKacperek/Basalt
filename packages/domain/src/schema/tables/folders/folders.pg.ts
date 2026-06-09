import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "../../base/timestamps/timestamps.pg";
import { workspaces } from "../workspaces/workspace.pg";

export const folders = pgTable(
  'folders',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    workspace_id: uuid('workspace_id').notNull().references(() => workspaces.id),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  }
);
