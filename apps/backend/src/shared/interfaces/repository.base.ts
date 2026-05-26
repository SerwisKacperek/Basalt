import type { Select, Insert } from '../../schema/types';
import type { schema as pgSchema } from '../../schema/adapters/pg';
import type { Filters } from '../utils/filters';

export interface IRepository<K extends keyof typeof pgSchema> {
  findById(id: string): Promise<Select<K> | null>;
  findAll(filters?: Filters<Select<K>>): Promise<Select<K>[]>;
  create(dto: Insert<K>): Promise<Select<K>>;
  update(id: string, dto: Partial<Insert<K>>): Promise<Select<K> | null>;
  delete(id: string): Promise<Select<K> | null>;
}