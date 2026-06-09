import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { timestamps } from "../../base/timestamps/timestamps.sqlite";
import { folders } from "../folders/folders.sqlite";
import { workspaces } from "../workspaces/workspace.sqlite";

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    folder_id: text('folder_id').references(() => folders.id),
    workspace_id: text('workspace_id').references(() => workspaces.id),
    name: text('name').notNull(),
    ...timestamps,
  }
);
