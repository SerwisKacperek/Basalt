import { Elysia, t } from 'elysia';

import type { Db } from '../../shared/factories/db.factory';
import type { IController } from '../../shared/interfaces/controller.base';
import { schema } from '../../shared/factories/schema.factory';
import { FolderController } from './folder.controller';
import { FolderService, FolderRepository } from '@basalt/domain';
import { errorHandler } from '../../shared/middleware';
import { FolderBody, FolderResponse } from '../../schema/tables/folders/folders.schema';

export const createFolderRoutes = (
  db: Db,
  controller: IController<'folders'> = new FolderController(new FolderService(new FolderRepository(db as any, schema)))
) => {
  return new Elysia({ prefix: '/folders' })
    .use(errorHandler)
    .get('/', () => controller.getAll(), {
      response: t.Array(FolderResponse),
    })
    .get('/:id', ({ params }) => controller.getById(params.id), {
      params: t.Object({ id: t.String() }),
      response: FolderResponse,
    })
    .post('/', ({ body, set }) => {
      set.status = 201;
      return controller.create(body as any);
    }, {
      body: FolderBody,
      response: { 201: FolderResponse },
    })
    .patch('/:id', ({ params, body }) => controller.update(
      params.id,
      body as any,
    ), {
      params: t.Object({ id: t.String() }),
      body: FolderBody,
      response: FolderResponse,
    })
    .delete('/:id', ({ params }) => controller.remove(params.id), {
      params: t.Object({ id: t.String() }),
      response: t.Void(),
    })
}
