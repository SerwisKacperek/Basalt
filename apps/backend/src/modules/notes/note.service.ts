import type { Select, Insert } from '../../schema/types';
import type { IService } from '../../shared/interfaces/service.base';
import type { NoteRepository } from "./note.repository";
import type { Filters } from '../../shared/utils';
import { NotFoundException } from '../../shared/errors';

export class NoteService implements IService<'notes'> {
  constructor(private repository: NoteRepository) { }

  async findById(
    id: string
  ): Promise<Select<'notes'>> {
    const note = await this.repository.findById(id);
    if (!note) throw new NotFoundException('Note', id);
    return note;
  }

  findAll(
    filters?: Filters<Select<'notes'>>
  ): Promise<Select<'notes'>[]> {
    return this.repository.findAll(filters);
  }

  create(
    dto: Insert<'notes'>
  ): Promise<Select<'notes'>> {
    return this.repository.create(dto);
  }

  async update(
    id: string,
    dto: Partial<Insert<'notes'>>
  ): Promise<Select<'notes'>> {
    const note = await this.repository.update(id, dto);
    if (!note) throw new NotFoundException('Note', id);
    return note;
  }

  async delete(
    id: string
  ): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundException('Note', id);
  }
}