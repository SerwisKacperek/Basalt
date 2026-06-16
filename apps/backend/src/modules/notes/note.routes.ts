import { Elysia, t } from 'elysia';

import type { Db } from '../../shared/factories/db.factory';
import type { RawDb } from '../../shared/factories/db.factory';
import type { IController } from '../../shared/interfaces/controller.base';
import { getDialect } from '../../shared/factories/db.factory';
import { schema } from '../../shared/factories/schema.factory';
import { errorHandler } from '../../shared/middleware';
import { NoteBody, NoteResponse, NoteUpdateBody } from '../../schema/tables/notes/notes.schema';
import { NoteController } from './note.controller';
import { NoteService, NoteRepository } from '@basalt/domain';
import { createNoteTablesSQL, dropNoteTablesSQL } from '@basalt/db/schema';
import { noteEventBus } from './note-event-bus';

export const createNoteRoutes = (
  db: Db,
  rawDb: RawDb,
  controller: IController<'notes'> = new NoteController(new NoteService(new NoteRepository(db as any, schema))),
) => {
  const dialect = getDialect();

  return new Elysia({ prefix: '/notes' })
    .use(errorHandler)
    .get('/', () => controller.getAll(), {
      response: t.Array(NoteResponse),
    })
    .get('/:id', ({ params }) => controller.getById(params.id), {
      params: t.Object({ id: t.String() }),
      response: NoteResponse,
    })
    .post('/', async ({ body, set }) => {
      set.status = 201;
      const note = await controller.create(body as any);
      for (const sql of createNoteTablesSQL(note.id, dialect)) {
        await rawDb.exec(sql);
      }
      noteEventBus.emit({ type: 'created', noteId: note.id });
      return note;
    }, {
      body: NoteBody,
      response: { 201: NoteResponse },
    })
    .patch('/:id', ({ params, body }) => controller.update(params.id, body as any), {
      params: t.Object({ id: t.String() }),
      body: NoteUpdateBody,
      response: NoteResponse,
    })
    .delete('/:id', async ({ params }) => {
      const result = await controller.remove(params.id);
      for (const sql of dropNoteTablesSQL(params.id)) {
        await rawDb.exec(sql);
      }
      noteEventBus.emit({ type: 'deleted', noteId: params.id });
      return result;
    }, {
      params: t.Object({ id: t.String() }),
      response: t.Void(),
    });
};
