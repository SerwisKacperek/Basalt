import { Elysia, t } from 'elysia';
import type { TObject } from '@sinclair/typebox';

import type { schema as pgSchema } from '../../schema/adapters/pg';
import type { IController } from '../interfaces/controller.base';
import { errorHandler } from '../middleware';

export const createCrudRoutes = <K extends keyof typeof pgSchema>(
  prefix: string,
  controller: IController<K>,
  bodySchema: TObject,
  responseSchema: TObject,
) =>
  new Elysia({ prefix })
    .use(errorHandler)
    .get('/', () => controller.getAll(), {
      response: t.Array(responseSchema),
    })
    .get('/:id', ({ params }) => controller.getById(params.id), {
      params: t.Object({ id: t.String() }),
      response: responseSchema,
    })
    .post('/', ({ body, set }) => { set.status = 201; return controller.create(body as any); }, {
      body: bodySchema,
      response: { 201: responseSchema },
    })
    .patch('/:id', ({ params, body }) => controller.update(params.id, body as any), {
      params: t.Object({ id: t.String() }),
      body: t.Partial(bodySchema),
      response: responseSchema,
    })
    .delete('/:id', ({ params }) => controller.remove(params.id), {
      params: t.Object({ id: t.String() }),
      response: t.Void(),
    });
