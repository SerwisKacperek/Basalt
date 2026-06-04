import { describe, it, expect, beforeEach } from 'vitest';
import { FolderService } from '@/modules/folders/folder.service';
import { NotFoundException } from '@/shared/errors';

const folder = {
  id: '1',
  workspace_id: 'ws-1',
  name: 'Test Folder',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('FolderService', () => {
  let repo: any;
  let service: FolderService;

  beforeEach(() => {
    repo = {
      findById: async (_id: string) => null,
      findAll: async () => [],
      create: async (dto: any) => ({ ...folder, ...dto }),
      update: async (_id: string, _dto: any) => null,
      delete: async (_id: string) => null,
    };
    service = new FolderService(repo);
  });

  describe('findById', () => {
    it('returns folder when found', async () => {
      repo.findById = async () => folder;
      expect(await service.findById('1')).toEqual(folder);
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
      repo.findAll = async () => [folder];
      expect(await service.findAll()).toEqual([folder]);
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
    it('returns created folder', async () => {
      repo.create = async (d: any) => ({ ...folder, ...d });
      expect((await service.create({ name: 'New Folder' } as any)).name).toBe('New Folder');
    });

    it('delegates to repo', async () => {
      let received: any;
      repo.create = async (d: any) => { received = d; return folder; };
      const dto = { name: 'X', workspace_id: 'ws-1' } as any;
      await service.create(dto);
      expect(received).toEqual(dto);
    });
  });

  describe('update', () => {
    it('returns updated folder when found', async () => {
      const updated = { ...folder, name: 'Updated' };
      repo.update = async () => updated;
      expect(await service.update('1', { name: 'Updated' })).toEqual(updated);
    });

    it('throws NotFoundException when not found', async () => {
      await expect(service.update('missing', {})).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('delete', () => {
    it('resolves without value when deleted', async () => {
      repo.delete = async () => folder;
      await expect(service.delete('1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when not found', async () => {
      await expect(service.delete('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
