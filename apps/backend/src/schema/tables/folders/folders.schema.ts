import { t } from 'elysia';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema
} from 'drizzle-typebox';

import { schema } from '../../../shared/factories/schema.factory';

const createFolderSelectSchema: any = createSelectSchema;
const createFolderInsertSchema: any = createInsertSchema;
const createFolderUpdateSchema: any = createUpdateSchema;

const folders = schema.folders;

export const FolderResponse = createFolderSelectSchema(folders);
export const FolderBody = t.Pick(
  createFolderInsertSchema(folders),
  ['id', 'workspace_id', 'name'],
);
export const FolderUpdateBody = t.Pick(
  createFolderUpdateSchema(folders),
  ['folder_id', 'workspace_id', 'name'],
)