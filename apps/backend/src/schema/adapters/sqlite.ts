import type { AppSchema } from '../types';

import { users } from "../tables/users/users.sqlite";

export const schema = {
  users: users,
} satisfies AppSchema;

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
