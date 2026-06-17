import { sql } from "drizzle-orm";
import { integer, pgTable, uuid, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "../../base/timestamps/timestamps.pg";
import { folders } from "../folders/folders.pg";
import { workspaces } from "../workspaces/workspace.pg";

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    folder_id: uuid('folder_id').references(() => folders.id),
    workspace_id: uuid('workspace_id').references(() => workspaces.id),
    name: varchar({ length: 255 }).notNull(),
    position: integer('position').notNull().default(0),
    ...timestamps,
  }
);
