import type { Select, Insert } from '../../schema/types';
import type { IController } from '../../shared/interfaces/controller.base';
import type { Filters } from '../../shared/utils/filters';
import type { WorkspaceService } from './workspace.service';

export class WorkspaceController implements IController<'workspaces'> {
  constructor(private service: WorkspaceService) {}

  getById(id: string): Promise<Select<'workspaces'>> {
    return this.service.findById(id);
  }

  getAll(filters?: Filters<Select<'workspaces'>>): Promise<Select<'workspaces'>[]> {
    return this.service.findAll(filters);
  }

  create(body: Insert<'workspaces'>): Promise<Select<'workspaces'>> {
    return this.service.create(body);
  }

  update(id: string, body: Partial<Insert<'workspaces'>>): Promise<Select<'workspaces'>> {
    return this.service.update(id, body);
  }

  remove(id: string): Promise<void> {
    return this.service.delete(id);
  }
}
