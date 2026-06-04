import { t } from 'elysia';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-typebox';

import { schema } from '../../../shared/factories/schema.factory';

const createNoteSelectSchema: any = createSelectSchema;
const createNoteInsertSchema: any = createInsertSchema;
const createNoteUpdateSchema: any = createUpdateSchema;

const notes = schema.notes;

export const NoteResponse = createNoteSelectSchema(notes);
export const NoteBody = t.Pick(
  createNoteInsertSchema(notes),
  ['folder_id', 'workspace_id', 'name'],
);
export const NoteUpdateBody = t.Pick(
  createNoteUpdateSchema(notes),
  ['folder_id', 'workspace_id', 'name'],
);