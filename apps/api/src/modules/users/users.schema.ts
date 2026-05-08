import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { baseColumns } from "../../db/base.schema.js";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email"),
  password: text("password").notNull(),
  ...baseColumns,
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
