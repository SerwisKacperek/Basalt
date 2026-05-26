import type { Select, Insert } from '../../schema/types';
import type { IService } from '../../shared/interfaces/service.base';
import type { Filters } from '../../shared/utils/filters';
import { NotFoundException } from '../../shared/errors/not-found.exception';
import type { WorkspaceRepository } from './workspace.repository';

export class WorkspaceService implements IService<'workspaces'> {
  constructor(private repository: WorkspaceRepository) {}

  async findById(id: string): Promise<Select<'workspaces'>> {
    const workspace = await this.repository.findById(id);
    if (!workspace) throw new NotFoundException('Workspace', id);
    return workspace;
  }

  findAll(filters?: Filters<Select<'workspaces'>>): Promise<Select<'workspaces'>[]> {
    return this.repository.findAll(filters);
  }

  create(dto: Insert<'workspaces'>): Promise<Select<'workspaces'>> {
    return this.repository.create(dto);
  }

  async update(id: string, dto: Partial<Insert<'workspaces'>>): Promise<Select<'workspaces'>> {
    const workspace = await this.repository.update(id, dto);
    if (!workspace) throw new NotFoundException('Workspace', id);
    return workspace;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundException('Workspace', id);
  }
}
