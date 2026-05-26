import { t } from 'elysia';

import type { Db } from '../../shared/factories/db.factory';
import { createCrudRoutes } from '../../shared/factories/crud-routes.factory';
import { WorkspaceRepository } from './workspace.repository';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';

const WorkspaceBody = t.Object({ name: t.String({ minLength: 1 }) });
const WorkspaceResponse = t.Object({
  id: t.String(),
  name: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  deletedAt: t.Nullable(t.Date()),
});

export const createWorkspaceRoutes = (db: Db) =>
  createCrudRoutes(
    '/workspaces',
    new WorkspaceController(new WorkspaceService(new WorkspaceRepository(db))),
    WorkspaceBody,
    WorkspaceResponse,
  );
