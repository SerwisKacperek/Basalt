import { describe, it, expect, beforeEach } from 'vitest';
import { FolderController } from '@/modules/folders/folder.controller';

const folder = {
  id: '1',
  workspace_id: 'ws-1',
  name: 'Test Folder',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('FolderController', () => {
  let service: any;
  let controller: FolderController;

  beforeEach(() => {
    service = {
      findById: async (id: string) => ({ ...folder, id }),
      findAll: async () => [folder],
      create: async (dto: any) => ({ ...folder, ...dto }),
      update: async (id: string, dto: any) => ({ ...folder, id, ...dto }),
      delete: async (_id: string) => undefined,
    };
    controller = new FolderController(service);
  });

  it('getById delegates to service.findById with correct id', async () => {
    let received: string | undefined;
    service.findById = async (id: string) => { received = id; return folder; };
    await controller.getById('abc');
    expect(received).toBe('abc');
  });

  it('getById returns service result', async () => {
    service.findById = async () => folder;
    expect(await controller.getById('1')).toEqual(folder);
  });

  it('getAll delegates to service.findAll', async () => {
    let called = false;
    service.findAll = async () => { called = true; return []; };
    await controller.getAll();
    expect(called).toBe(true);
  });

  it('getAll passes filters to service', async () => {
    let received: any;
    service.findAll = async (f: any) => { received = f; return []; };
    await controller.getAll({ name: 'x' } as any);
    expect(received).toEqual({ name: 'x' });
  });

  it('create delegates to service.create with body', async () => {
    let received: any;
    service.create = async (dto: any) => { received = dto; return folder; };
    const dto = { name: 'New Folder', workspace_id: 'ws-1' } as any;
    await controller.create(dto);
    expect(received).toEqual(dto);
  });

  it('create returns service result', async () => {
    service.create = async (dto: any) => ({ ...folder, ...dto });
    expect((await controller.create({ name: 'X' } as any)).name).toBe('X');
  });

  it('update delegates to service.update with correct id and dto', async () => {
    let receivedId: string | undefined;
    let receivedDto: any;
    service.update = async (id: string, dto: any) => { receivedId = id; receivedDto = dto; return folder; };
    await controller.update('42', { name: 'Updated' });
    expect(receivedId).toBe('42');
    expect(receivedDto).toEqual({ name: 'Updated' });
  });

  it('remove delegates to service.delete with correct id', async () => {
    let received: string | undefined;
    service.delete = async (id: string) => { received = id; };
    await controller.remove('99');
    expect(received).toBe('99');
  });
});
