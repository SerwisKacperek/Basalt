import { users } from "../tables/users/users.pg";

export const schema = {
  users: users,
}

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
