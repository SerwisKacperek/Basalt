import { integer } from "drizzle-orm/sqlite-core";

export const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' })
};
