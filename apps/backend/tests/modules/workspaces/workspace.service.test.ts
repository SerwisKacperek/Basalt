import { describe, it, expect, beforeEach } from 'vitest';
import { WorkspaceService } from '@/modules/workspaces/workspace.service';
import { NotFoundException } from '@/shared/errors';

const ws = { id: '1', name: 'Test', createdAt: new Date(), updatedAt: new Date(), deletedAt: null };

describe('WorkspaceService', () => {
  let repo: any;
  let service: WorkspaceService;

  beforeEach(() => {
    repo = {
      findById: async (_id: string) => null,
      findAll: async () => [],
      create: async (dto: any) => ({ ...ws, ...dto }),
      update: async (_id: string, _dto: any) => null,
      delete: async (_id: string) => null,
    };
    service = new WorkspaceService(repo);
  });

  describe('findById', () => {
    it('returns workspace when found', async () => {
      repo.findById = async () => ws;
      expect(await service.findById('1')).toEqual(ws);
    });

    it('throws NotFoundException when not found', async () => {
      await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('NotFoundException message contains the id', async () => {
      await expect(service.findById('bad-id')).rejects.toThrow('bad-id');
    });
  });

  describe('findAll', () => {
    it('returns list from repo', async () => {
      repo.findAll = async () => [ws];
      expect(await service.findAll()).toEqual([ws]);
    });

    it('passes filters to repo', async () => {
      let received: any;
      repo.findAll = async (f: any) => { received = f; return []; };
      const filters = { name: 'x' } as any;
      await service.findAll(filters);
      expect(received).toEqual(filters);
    });

    it('returns empty array when no results', async () => {
      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('create', () => {
    it('returns created workspace', async () => {
      repo.create = async (d: any) => ({ ...ws, ...d });
      expect((await service.create({ name: 'New' } as any)).name).toBe('New');
    });

    it('delegates to repo', async () => {
      let received: any;
      repo.create = async (d: any) => { received = d; return ws; };
      const dto = { name: 'X' } as any;
      await service.create(dto);
      expect(received).toEqual(dto);
    });
  });

  describe('update', () => {
    it('returns updated workspace when found', async () => {
      const updated = { ...ws, name: 'Updated' };
      repo.update = async () => updated;
      expect(await service.update('1', { name: 'Updated' })).toEqual(updated);
    });

    it('throws NotFoundException when not found', async () => {
      await expect(service.update('missing', {})).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('delete', () => {
    it('resolves without value when deleted', async () => {
      repo.delete = async () => ws;
      await expect(service.delete('1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when not found', async () => {
      await expect(service.delete('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
