import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { tags } from "../tags/tags.sqlite";
import { notes } from "../notes/notes.sqlite";

export const noteTags = sqliteTable(
  'noteTags',
  {
    tag_id: text('tag_id').notNull().references(() => tags.id),
    note_id: text('note_id').notNull().references(() => notes.id),
  }
);
