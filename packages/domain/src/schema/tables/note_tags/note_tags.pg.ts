import { pgTable, uuid } from "drizzle-orm/pg-core";

import { tags } from "../tags/tags.pg";
import { notes } from "../notes/notes.pg";

export const noteTags = pgTable(
  'noteTags',
  {
    tag_id: uuid('tag_id').notNull().references(() => tags.id),
    note_id: uuid('note_id').notNull().references(() => notes.id),
  }
);
