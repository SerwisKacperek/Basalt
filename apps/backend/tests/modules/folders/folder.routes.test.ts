import { describe, it, expect, vi } from 'vitest';
import { createFolderRoutes } from '@/modules/folders/folder.routes';
import { NotFoundException } from '@basalt/domain';

const db = null as any;

const folder = {
  id: '22222222-2222-2222-2222-222222222222',
  workspace_id: '11111111-1111-1111-1111-111111111111',
  name: 'Test Folder',
  position: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

function makeApp(overrides: Record<string, any> = {}) {
  const controller = {
    getAll: vi.fn().mockResolvedValue([folder]),
    getById: vi.fn().mockResolvedValue(folder),
    create: vi.fn().mockResolvedValue(folder),
    update: vi.fn().mockResolvedValue(folder),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { app: createFolderRoutes(db, controller as any), controller };
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

describe('folder routes', () => {
  describe('GET /folders', () => {
    it('returns 200 with array', async () => {
      const { app } = makeApp();
      const res = await app.handle(new Request('http://localhost/folders'));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(JSON.parse(JSON.stringify([folder])));
    });

    it('delegates to controller.getAll', async () => {
      const { app, controller } = makeApp();
      await app.handle(new Request('http://localhost/folders'));
      expect(controller.getAll).toHaveBeenCalledOnce();
    });
  });

  describe('GET /folders/:id', () => {
    it('returns 200 with folder', async () => {
      const { app } = makeApp();
      const res = await app.handle(new Request('http://localhost/folders/1'));
      expect(res.status).toBe(200);
      expect((await res.json()).id).toBe('22222222-2222-2222-2222-222222222222');
    });

    it('passes id to controller.getById', async () => {
      const { app, controller } = makeApp();
      await app.handle(new Request('http://localhost/folders/abc'));
      expect(controller.getById).toHaveBeenCalledWith('abc');
    });

    it('returns 404 when controller throws NotFoundException', async () => {
      const { app } = makeApp({
        getById: vi.fn().mockRejectedValue(new NotFoundException('Folder', 'x')),
      });
      const res = await app.handle(new Request('http://localhost/folders/x'));
      expect(res.status).toBe(404);
    });
  });

  describe('POST /folders', () => {
    it('returns 201 with created folder', async () => {
      const { app } = makeApp();
      const res = await post(app, '/folders', { name: 'New Folder', workspace_id: '11111111-1111-1111-1111-111111111111' });
      expect(res.status).toBe(201);
    });

    it('passes body to controller.create', async () => {
      const { app, controller } = makeApp();
      await post(app, '/folders', { name: 'New Folder', workspace_id: '11111111-1111-1111-1111-111111111111' });
      expect(controller.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Folder', workspace_id: '11111111-1111-1111-1111-111111111111' }),
      );
    });

    it('returns 422 when name is missing', async () => {
      const { app } = makeApp();
      expect((await post(app, '/folders', { workspace_id: '11111111-1111-1111-1111-111111111111' })).status).toBe(422);
    });

    it('returns 422 when workspace_id is missing', async () => {
      const { app } = makeApp();
      expect((await post(app, '/folders', { name: 'New Folder' })).status).toBe(422);
    });

    it('returns 400 for invalid JSON', async () => {
      const { app } = makeApp();
      const res = await app.handle(new Request('http://localhost/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not{json',
      }));
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /folders/:id', () => {
    it('returns 200 with updated folder', async () => {
      const { app } = makeApp();
      const res = await patch(app, '/folders/1', { name: 'Updated', workspace_id: '11111111-1111-1111-1111-111111111111' });
      expect(res.status).toBe(200);
    });

    it('passes id and body to controller.update', async () => {
      const { app, controller } = makeApp();
      await patch(app, '/folders/42', { name: 'Updated', workspace_id: '11111111-1111-1111-1111-111111111111' });
      expect(controller.update).toHaveBeenCalledWith('42', expect.objectContaining({ name: 'Updated' }));
    });

    it('returns 404 when controller throws NotFoundException', async () => {
      const { app } = makeApp({
        update: vi.fn().mockRejectedValue(new NotFoundException('Folder', 'x')),
      });
      expect((await patch(app, '/folders/x', { name: 'Y', workspace_id: '11111111-1111-1111-1111-111111111111' })).status).toBe(404);
    });
  });

  describe('DELETE /folders/:id', () => {
    it('returns 200', async () => {
      const { app } = makeApp();
      expect((await del(app, '/folders/1')).status).toBe(200);
    });

    it('passes id to controller.remove', async () => {
      const { app, controller } = makeApp();
      await del(app, '/folders/99');
      expect(controller.remove).toHaveBeenCalledWith('99');
    });

    it('returns 404 when controller throws NotFoundException', async () => {
      const { app } = makeApp({
        remove: vi.fn().mockRejectedValue(new NotFoundException('Folder', 'x')),
      });
      expect((await del(app, '/folders/x')).status).toBe(404);
    });
  });
});
