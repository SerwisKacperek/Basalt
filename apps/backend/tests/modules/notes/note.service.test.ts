import { describe, it, expect, beforeEach } from 'vitest';
import { NoteService, NotFoundException } from '@basalt/domain';

const note = {
  id: '1',
  name: 'Test Note',
  workspace_id: 'ws-1',
  folder_id: 'f-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('NoteService', () => {
  let repo: any;
  let service: NoteService;

  beforeEach(() => {
    repo = {
      findById: async (_id: string) => null,
      findAll: async () => [],
      create: async (dto: any) => ({ ...note, ...dto }),
      update: async (_id: string, _dto: any) => null,
      delete: async (_id: string) => null,
    };
    service = new NoteService(repo);
  });

  describe('findById', () => {
    it('returns note when found', async () => {
      repo.findById = async () => note;
      expect(await service.findById('1')).toEqual(note);
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
      repo.findAll = async () => [note];
      expect(await service.findAll()).toEqual([note]);
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
    it('returns created note', async () => {
      repo.create = async (d: any) => ({ ...note, ...d });
      expect((await service.create({ name: 'New Note' } as any)).name).toBe('New Note');
    });

    it('delegates to repo', async () => {
      let received: any;
      repo.create = async (d: any) => { received = d; return note; };
      const dto = { name: 'X', workspace_id: 'ws-1', folder_id: 'f-1' } as any;
      await service.create(dto);
      expect(received).toEqual(dto);
    });
  });

  describe('update', () => {
    it('returns updated note when found', async () => {
      const updated = { ...note, name: 'Updated' };
      repo.update = async () => updated;
      expect(await service.update('1', { name: 'Updated' })).toEqual(updated);
    });

    it('throws NotFoundException when not found', async () => {
      await expect(service.update('missing', {})).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('delete', () => {
    it('resolves without value when deleted', async () => {
      repo.delete = async () => note;
      await expect(service.delete('1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when not found', async () => {
      await expect(service.delete('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
