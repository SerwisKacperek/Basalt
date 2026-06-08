import { Elysia, t } from 'elysia';

import type { Db } from '../../shared/factories/db.factory';
import { schema } from '../../shared/factories/schema.factory';
import { errorHandler } from '../../shared/middleware';
import { UserResponse, UserRegisterBody, UserUpdateBody } from '../../schema/tables/users/users.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from '@basalt/domain';

export const createUserRoutes = (
  db: Db,
  controller: UserController = new UserController(new UserService(new UserRepository(db as any, schema))),
) => {
  return new Elysia({ prefix: '/users' })
    .use(errorHandler)
    .post('/register', ({ body, set }) => {
      set.status = 201;
      return controller.register(body.email, body.password);
    }, {
      body: UserRegisterBody,
      response: { 201: UserResponse },
    })
    .get('/', () => controller.getAll(), {
      response: t.Array(UserResponse),
    })
    .get('/:id', ({ params }) => controller.getById(params.id), {
      params: t.Object({ id: t.String() }),
      response: UserResponse,
    })
    .patch('/:id', ({ params, body }) => controller.update(params.id, body as any), {
      params: t.Object({ id: t.String() }),
      body: UserUpdateBody,
      response: UserResponse,
    })
    .delete('/:id', ({ params }) => controller.remove(params.id), {
      params: t.Object({ id: t.String() }),
      response: t.Void(),
    });
};
