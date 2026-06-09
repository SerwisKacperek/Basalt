import type { Select, Insert } from '@basalt/domain';
import type { Filters } from '@basalt/domain';

export interface IUserService {
  findById(id: string): Promise<Select<'users'>>;
  findAll(filters?: Filters<Select<'users'>>): Promise<Select<'users'>[]>;
  create(dto: Insert<'users'>): Promise<Select<'users'>>;
  update(id: string, dto: Partial<Insert<'users'>>): Promise<Select<'users'>>;
  delete(id: string): Promise<void>;
}
