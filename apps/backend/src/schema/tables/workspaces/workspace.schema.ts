import { t } from 'elysia';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-typebox';

import { schema } from '../../../shared/factories/schema.factory';

const createWorkspaceSelectSchema: any = createSelectSchema;
const createWorkspaceInsertSchema: any = createInsertSchema;
const createWorkspaceUpdateSchema: any = createUpdateSchema;

const workspaces = schema.workspaces;

export const WorkspaceResponse = createWorkspaceSelectSchema(workspaces);
export const WorkspaceBody = t.Pick(
  createWorkspaceInsertSchema(workspaces),
  ['id', 'name'],
);
export const WorkspaceUpdateBody = t.Pick(
  createWorkspaceUpdateSchema(workspaces),
  ['name'],
);