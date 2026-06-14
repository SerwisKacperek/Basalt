import { describe, it, expect, vi } from 'vitest';
import { createNoteRoutes } from '@/modules/notes/note.routes';

const db = null as any;
import { NotFoundException } from '@basalt/domain';

const note = {
  id: '1',
  name: 'Test Note',
  workspace_id: 'ws-1',
  folder_id: 'f-1',
  position: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

function makeApp(overrides: Record<string, any> = {}) {
  const controller = {
    getAll: vi.fn().mockResolvedValue([note]),
    getById: vi.fn().mockResolvedValue(note),
    create: vi.fn().mockResolvedValue(note),
    update: vi.fn().mockResolvedValue(note),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { app: createNoteRoutes(db, controller as any), controller };
}

function post(app: any, path: string, body: unknown) {
  return app.handle(new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

function patch(app: any, path: string, body: unknown) {
  return app.handle(new Request(`http://localhost${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

function del(app: any, path: string) {
  return app.handle(new Request(`http://localhost${path}`, { method: 'DELETE' }));
}

describe('note routes', () => {
  describe('GET /notes', () => {
    it('returns 200 with array', async () => {
      const { app } = makeApp();
      const res = await app.handle(new Request('http://localhost/notes'));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(JSON.parse(JSON.stringify([note])));
    });

    it('delegates to controller.getAll', async () => {
      const { app, controller } = makeApp();
      await app.handle(new Request('http://localhost/notes'));
      expect(controller.getAll).toHaveBeenCalledOnce();
    });
  });

  describe('GET /notes/:id', () => {
    it('returns 200 with note', async () => {
      const { app } = makeApp();
      const res = await app.handle(new Request('http://localhost/notes/1'));
      expect(res.status).toBe(200);
      expect((await res.json()).id).toBe('1');
    });

    it('passes id to controller.getById', async () => {
      const { app, controller } = makeApp();
      await app.handle(new Request('http://localhost/notes/abc'));
      expect(controller.getById).toHaveBeenCalledWith('abc');
    });

    it('returns 404 when controller throws NotFoundException', async () => {
      const { app } = makeApp({
        getById: vi.fn().mockRejectedValue(new NotFoundException('Note', 'x')),
      });
      const res = await app.handle(new Request('http://localhost/notes/x'));
      expect(res.status).toBe(404);
    });
  });

  describe('POST /notes', () => {
    it('returns 201 with created note', async () => {
      const { app } = makeApp();
      const res = await post(app, '/notes', { name: 'New', workspace_id: 'ws-1', folder_id: 'f-1' });
      expect(res.status).toBe(201);
    });

    it('passes body to controller.create', async () => {
      const { app, controller } = makeApp();
      await post(app, '/notes', { name: 'New', workspace_id: 'ws-1', folder_id: 'f-1' });
      expect(controller.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New', workspace_id: 'ws-1', folder_id: 'f-1' }),
      );
    });

    it('returns 422 when name is missing', async () => {
      const { app } = makeApp();
      expect((await post(app, '/notes', { workspace_id: 'ws-1', folder_id: 'f-1' })).status).toBe(422);
    });

    it('allows creating a note without a workspace_id', async () => {
      const { app } = makeApp();
      expect((await post(app, '/notes', { name: 'New', folder_id: 'f-1' })).status).toBe(201);
    });

    it('allows creating a root note without a folder_id', async () => {
      const { app } = makeApp();
      expect((await post(app, '/notes', { name: 'New', workspace_id: 'ws-1' })).status).toBe(201);
    });

    it('returns 400 for invalid JSON', async () => {
      const { app } = makeApp();
      const res = await app.handle(new Request('http://localhost/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not{json',
      }));
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /notes/:id', () => {
    it('returns 200 with updated note', async () => {
      const { app } = makeApp();
      const res = await patch(app, '/notes/1', { name: 'Updated' });
      expect(res.status).toBe(200);
    });

    it('passes id and body to controller.update', async () => {
      const { app, controller } = makeApp();
      await patch(app, '/notes/42', { name: 'Updated' });
      expect(controller.update).toHaveBeenCalledWith('42', expect.objectContaining({ name: 'Updated' }));
    });

    it('returns 404 when controller throws NotFoundException', async () => {
      const { app } = makeApp({
        update: vi.fn().mockRejectedValue(new NotFoundException('Note', 'x')),
      });
      expect((await patch(app, '/notes/x', { name: 'Y' })).status).toBe(404);
    });
  });

  describe('DELETE /notes/:id', () => {
    it('returns 200', async () => {
      const { app } = makeApp();
      expect((await del(app, '/notes/1')).status).toBe(200);
    });

    it('passes id to controller.remove', async () => {
      const { app, controller } = makeApp();
      await del(app, '/notes/99');
      expect(controller.remove).toHaveBeenCalledWith('99');
    });

    it('returns 404 when controller throws NotFoundException', async () => {
      const { app } = makeApp({
        remove: vi.fn().mockRejectedValue(new NotFoundException('Note', 'x')),
      });
      expect((await del(app, '/notes/x')).status).toBe(404);
    });
  });
});
