import type { Select, Insert } from '@basalt/domain';
import type { Filters } from '@basalt/domain';

export interface IWorkspaceService {
  findById(id: string): Promise<Select<'workspaces'>>;
  findAll(filters?: Filters<Select<'workspaces'>>): Promise<Select<'workspaces'>[]>;
  create(dto: Insert<'workspaces'>): Promise<Select<'workspaces'>>;
  update(id: string, dto: Partial<Insert<'workspaces'>>): Promise<Select<'workspaces'>>;
  delete(id: string): Promise<void>;
}
