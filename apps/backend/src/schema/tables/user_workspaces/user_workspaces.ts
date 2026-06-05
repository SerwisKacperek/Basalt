import { sql } from "drizzle-orm";
import { pgTable, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "../../base/timestamps/timestamps.pg";
import { users } from "../users/users.pg";
import { workspaces } from "../workspaces/workspace.pg";

export const userWorkspaces = pgTable(
  'user_workspaces',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    user_id: uuid('user_id').notNull().references(() => users.id),
    workspace_id: uuid('workspace_id').notNull().references(() => workspaces.id),
    ...timestamps,
  }
);
