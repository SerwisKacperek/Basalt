import type { Select, Insert } from '../../schema/types';
import type { IService } from '../../shared/interfaces/service.base';
import type { FolderRepository } from './folder.repository';
import type { Filters } from '../../shared/utils';
import { NotFoundException } from '../../shared/errors';

export class FolderService implements IService<'folders'> {
  constructor(private repository: FolderRepository) { }

  async findById(
    id: string
  ): Promise<Select<'folders'>> {
    const folder = await this.repository.findById(id);
    if (!folder) throw new NotFoundException('Folder', id);
    return folder;
  }

  findAll(
    filters?: Filters<Select<'folders'>>
  ): Promise<Select<'folders'>[]> {
    return this.repository.findAll(filters);
  }

  create(
    dto: Insert<'folders'>
  ): Promise<Select<'folders'>> {
    return this.repository.create(dto);
  }

  async update(
    id: string,
    dto: Partial<Select<'folders'>>
  ): Promise<Select<'folders'>> {
    const folder = await this.repository.update(id, dto);
    if (!folder) throw new NotFoundException('Folder', id);
    return folder;
  }

  async delete(
    id: string
  ): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundException('Folder', id);
  }
}