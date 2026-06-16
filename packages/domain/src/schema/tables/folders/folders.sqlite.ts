import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { timestamps } from "../../base/timestamps/timestamps.sqlite";
import { workspaces } from "../workspaces/workspace.sqlite";

export const folders = sqliteTable(
  'folders',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
    name: text('name').notNull(),
    position: integer('position').notNull().default(0),
    ...timestamps,
  }
);
