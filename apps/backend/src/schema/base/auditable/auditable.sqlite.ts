import { text } from "drizzle-orm/sqlite-core";
import { timestamps } from "../timestamps/timestamps.sqlite";

export const auditable = {
  ...timestamps,
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by').notNull()
};
