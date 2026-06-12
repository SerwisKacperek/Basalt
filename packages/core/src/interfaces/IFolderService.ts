import type { Select, Insert } from '@basalt/domain';
import type { Filters } from '@basalt/domain';

export interface IFolderService {
  findById(id: string): Promise<Select<'folders'>>;
  findAll(filters?: Filters<Select<'folders'>>): Promise<Select<'folders'>[]>;
  create(dto: Insert<'folders'>): Promise<Select<'folders'>>;
  update(id: string, dto: Partial<Insert<'folders'>>): Promise<Select<'folders'>>;
  delete(id: string): Promise<void>;
}
