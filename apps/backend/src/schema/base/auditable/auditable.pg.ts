import { uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../timestamps/timestamps.pg";

export const auditable = {
  ...timestamps,
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull()
}
