import type { IService } from '../interfaces/service.base';
import type { Select, Insert } from '../schema/types';
import type { Filters } from '../utils/filters';
import type { NoteRepository } from '../repositories/note.repository';
import { NotFoundException } from '../errors';

export class NoteService implements IService<'notes'> {
  constructor(protected repository: NoteRepository) {}

  async findById(id: string): Promise<Select<'notes'>> {
    const note = await this.repository.findById(id);
    if (!note) throw new NotFoundException('Note', id);
    return note;
  }

  findAll(filters?: Filters<Select<'notes'>>): Promise<Select<'notes'>[]> {
    return this.repository.findAll(filters);
  }

  create(dto: Insert<'notes'>): Promise<Select<'notes'>> {
    return this.repository.create(dto);
  }

  async update(id: string, dto: Partial<Insert<'notes'>>): Promise<Select<'notes'>> {
    const note = await this.repository.update(id, dto);
    if (!note) throw new NotFoundException('Note', id);
    return note;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundException('Note', id);
  }
}
