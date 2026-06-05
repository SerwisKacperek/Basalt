import { Elysia, t } from 'elysia';

import type { Db } from '../../shared/factories/db.factory';
import type { IController } from '../../shared/interfaces/controller.base';
import { errorHandler } from '../../shared/middleware';
import { NoteBody, NoteResponse, NoteUpdateBody } from '../../schema/tables/notes/notes.schema';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { NoteRepository } from './note.repository';

export const createNoteRoutes = (
  db: Db,
  controller: IController<'notes'> = new NoteController(new NoteService(new NoteRepository(db))),
) => {

  return new Elysia({ prefix: '/notes' })
    .use(errorHandler)
    .get('/', () => controller.getAll(), {
      response: t.Array(NoteResponse),
    })
    .get('/:id', ({ params }) => controller.getById(params.id), {
      params: t.Object({ id: t.String() }),
      response: NoteResponse,
    })
    .post('/', ({ body, set }) => {
      set.status = 201;
      return controller.create(body as any);
    }, {
      body: NoteBody,
      response: { 201: NoteResponse },
    })
    .patch('/:id', ({ params, body }) => controller.update(params.id, body as any), {
      params: t.Object({ id: t.String() }),
      body: NoteUpdateBody,
      response: NoteResponse,
    })
    .delete('/:id', ({ params }) => controller.remove(params.id), {
      params: t.Object({ id: t.String() }),
      response: t.Void(),
    });
};