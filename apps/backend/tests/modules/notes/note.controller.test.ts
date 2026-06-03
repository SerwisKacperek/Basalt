import { describe, it, expect, beforeEach } from 'vitest';
import { NoteController } from '@/modules/notes/note.controller';

const note = {
  id: '1',
  name: 'Test Note',
  workspace_id: 'ws-1',
  folder_id: 'f-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('NoteController', () => {
  let service: any;
  let controller: NoteController;

  beforeEach(() => {
    service = {
      findById: async (id: string) => ({ ...note, id }),
      findAll: async () => [note],
      create: async (dto: any) => ({ ...note, ...dto }),
      update: async (id: string, dto: any) => ({ ...note, id, ...dto }),
      delete: async (_id: string) => undefined,
    };
    controller = new NoteController(service);
  });

  it('getById delegates to service.findById with correct id', async () => {
    let received: string | undefined;
    service.findById = async (id: string) => { received = id; return note; };
    await controller.getById('abc');
    expect(received).toBe('abc');
  });

  it('getById returns service result', async () => {
    service.findById = async () => note;
    expect(await controller.getById('1')).toEqual(note);
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
    service.create = async (dto: any) => { received = dto; return note; };
    const dto = { name: 'New', workspace_id: 'ws-1', folder_id: 'f-1' } as any;
    await controller.create(dto);
    expect(received).toEqual(dto);
  });

  it('create returns service result', async () => {
    service.create = async (dto: any) => ({ ...note, ...dto });
    expect((await controller.create({ name: 'X' } as any)).name).toBe('X');
  });

  it('update delegates to service.update with correct id and dto', async () => {
    let receivedId: string | undefined;
    let receivedDto: any;
    service.update = async (id: string, dto: any) => { receivedId = id; receivedDto = dto; return note; };
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
