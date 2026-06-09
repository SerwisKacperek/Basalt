import type { Select, Insert } from '@basalt/domain';
import type { Filters } from '@basalt/domain';

export interface INoteService {
  findById(id: string): Promise<Select<'notes'>>;
  findAll(filters?: Filters<Select<'notes'>>): Promise<Select<'notes'>[]>;
  create(dto: Insert<'notes'>): Promise<Select<'notes'>>;
  update(id: string, dto: Partial<Insert<'notes'>>): Promise<Select<'notes'>>;
  delete(id: string): Promise<void>;
}
