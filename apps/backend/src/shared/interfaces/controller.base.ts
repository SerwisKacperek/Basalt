import type { Select, Insert } from '@basalt/domain';
import type { schema as pgSchema } from '@basalt/domain/schema/pg';
import type { Filters } from '@basalt/domain';

export interface IController<K extends keyof typeof pgSchema> {
  getById(id: string): Promise<Select<K>>;
  getAll(filters?: Filters<Select<K>>): Promise<Select<K>[]>;
  create(body: Insert<K>): Promise<Select<K>>;
  update(id: string, body: Partial<Insert<K>>): Promise<Select<K>>;
  remove(id: string): Promise<void>;
}
