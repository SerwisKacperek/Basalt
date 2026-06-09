import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { timestamps } from "../../base/timestamps/timestamps.sqlite";
import { users } from "../users/users.sqlite";
import { workspaces } from "../workspaces/workspace.sqlite";

export const userWorkspaces = sqliteTable(
  'user_workspaces',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text('user_id').notNull().references(() => users.id),
    workspace_id: text('workspace_id').notNull().references(() => workspaces.id),
    ...timestamps,
  }
);
