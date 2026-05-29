import { Elysia, t } from 'elysia';

import type { Db } from '../../shared/factories/db.factory';
import { errorHandler } from '../../shared/middleware';
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

export const createWorkspaceRoutes = (db: Db) => {
  const controller = new WorkspaceController(
    new WorkspaceService(new WorkspaceRepository(db)),
  );

  return new Elysia({ prefix: '/workspaces' })
    .use(errorHandler)
    .get('/', () => controller.getAll(), {
      response: t.Array(WorkspaceResponse),
    })
    .get('/:id', ({ params }) => controller.getById(params.id), {
      params: t.Object({ id: t.String() }),
      response: WorkspaceResponse,
    })
    .post('/', ({ body, set }) => {
      set.status = 201;
      return controller.create(body);
    }, {
      body: WorkspaceBody,
      response: { 201: WorkspaceResponse },
    })
    .patch('/:id', ({ params, body }) => controller.update(params.id, body), {
      params: t.Object({ id: t.String() }),
      body: t.Partial(WorkspaceBody),
      response: WorkspaceResponse,
    })
    .delete('/:id', ({ params }) => controller.remove(params.id), {
      params: t.Object({ id: t.String() }),
      response: t.Void(),
    });
};
