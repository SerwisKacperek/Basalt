import { Elysia, t } from 'elysia';

import type { Db } from '../../shared/factories/db.factory';
import type { IController } from '../../shared/interfaces/controller.base';
import { errorHandler } from '../../shared/middleware';
import { WorkspaceBody, WorkspaceResponse, WorkspaceUpdateBody } from '../../schema/tables/workspaces/workspace.schema';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { WorkspaceRepository } from './workspace.repository';

export const createWorkspaceRoutes = (
  db: Db,
  controller: IController<'workspaces'> = new WorkspaceController(new WorkspaceService(new WorkspaceRepository(db))),
) => {

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
      return controller.create(body as any);
    }, {
      body: WorkspaceBody,
      response: { 201: WorkspaceResponse },
    })
    .patch('/:id', ({ params, body }) => controller.update(params.id, body as any), {
      params: t.Object({ id: t.String() }),
      body: WorkspaceUpdateBody,
      response: WorkspaceResponse,
    })
    .delete('/:id', ({ params }) => controller.remove(params.id), {
      params: t.Object({ id: t.String() }),
      response: t.Void(),
    });
};
