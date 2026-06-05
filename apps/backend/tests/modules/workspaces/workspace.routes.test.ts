import { describe, it, expect, vi } from 'vitest';
import { createWorkspaceRoutes } from '@/modules/workspaces/workspace.routes';

const db = null as any;
import { NotFoundException } from '@/shared/errors';

const ws = { id: '1', name: 'Test', createdAt: new Date(), updatedAt: new Date(), deletedAt: null };

function makeApp(overrides: Record<string, any> = {}) {
  const controller = {
    getAll: vi.fn().mockResolvedValue([ws]),
    getById: vi.fn().mockResolvedValue(ws),
    create: vi.fn().mockResolvedValue(ws),
    update: vi.fn().mockResolvedValue(ws),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { app: createWorkspaceRoutes(db, controller as any), controller };
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

describe('workspace routes', () => {
  describe('GET /workspaces', () => {
    it('returns 200 with array', async () => {
      const { app } = makeApp();
      const res = await app.handle(new Request('http://localhost/workspaces'));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(JSON.parse(JSON.stringify([ws])));
    });

    it('delegates to controller.getAll', async () => {
      const { app, controller } = makeApp();
      await app.handle(new Request('http://localhost/workspaces'));
      expect(controller.getAll).toHaveBeenCalledOnce();
    });
  });

  describe('GET /workspaces/:id', () => {
    it('returns 200 with workspace', async () => {
      const { app } = makeApp();
      const res = await app.handle(new Request('http://localhost/workspaces/1'));
      expect(res.status).toBe(200);
      expect((await res.json()).id).toBe('1');
    });

    it('passes id to controller.getById', async () => {
      const { app, controller } = makeApp();
      await app.handle(new Request('http://localhost/workspaces/abc'));
      expect(controller.getById).toHaveBeenCalledWith('abc');
    });

    it('returns 404 when controller throws NotFoundException', async () => {
      const { app } = makeApp({
        getById: vi.fn().mockRejectedValue(new NotFoundException('Workspace', 'x')),
      });
      const res = await app.handle(new Request('http://localhost/workspaces/x'));
      expect(res.status).toBe(404);
    });
  });

  describe('POST /workspaces', () => {
    it('returns 201 with created workspace', async () => {
      const { app } = makeApp();
      const res = await post(app, '/workspaces', { name: 'New' });
      expect(res.status).toBe(201);
    });

    it('passes body to controller.create', async () => {
      const { app, controller } = makeApp();
      await post(app, '/workspaces', { name: 'New' });
      expect(controller.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'New' }));
    });

    it('returns 422 when name is missing', async () => {
      const { app } = makeApp();
      expect((await post(app, '/workspaces', {})).status).toBe(422);
    });

    it('returns 400 for invalid JSON', async () => {
      const { app } = makeApp();
      const res = await app.handle(new Request('http://localhost/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not{json',
      }));
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /workspaces/:id', () => {
    it('returns 200 with updated workspace', async () => {
      const { app } = makeApp();
      const res = await patch(app, '/workspaces/1', { name: 'Updated' });
      expect(res.status).toBe(200);
    });

    it('passes id and body to controller.update', async () => {
      const { app, controller } = makeApp();
      await patch(app, '/workspaces/42', { name: 'Updated' });
      expect(controller.update).toHaveBeenCalledWith('42', expect.objectContaining({ name: 'Updated' }));
    });

    it('returns 404 when controller throws NotFoundException', async () => {
      const { app } = makeApp({
        update: vi.fn().mockRejectedValue(new NotFoundException('Workspace', 'x')),
      });
      expect((await patch(app, '/workspaces/x', { name: 'Y' })).status).toBe(404);
    });

  });

  describe('DELETE /workspaces/:id', () => {
    it('returns 200', async () => {
      const { app } = makeApp();
      expect((await del(app, '/workspaces/1')).status).toBe(200);
    });

    it('passes id to controller.remove', async () => {
      const { app, controller } = makeApp();
      await del(app, '/workspaces/99');
      expect(controller.remove).toHaveBeenCalledWith('99');
    });

    it('returns 404 when controller throws NotFoundException', async () => {
      const { app } = makeApp({
        remove: vi.fn().mockRejectedValue(new NotFoundException('Workspace', 'x')),
      });
      expect((await del(app, '/workspaces/x')).status).toBe(404);
    });
  });
});
