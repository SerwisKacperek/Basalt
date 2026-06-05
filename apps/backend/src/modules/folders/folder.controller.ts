import type { Select, Insert } from '../../schema/types';
import type { IController } from '../../shared/interfaces/controller.base';
import type { Filters } from '../../shared/utils';
import type { FolderService } from './folder.service';

export class FolderController implements IController<'folders'> {
  constructor(private service: FolderService) { }

  getById(
    id: string
  ): Promise<Select<'folders'>> {
    return this.service.findById(id);
  }

  getAll(
    filters?: Filters<Select<'folders'>>
  ): Promise<Select<'folders'>[]> {
    return this.service.findAll(filters);
  }

  create(
    body: Insert<'folders'>
  ): Promise<Select<'folders'>> {
    return this.service.create(body);
  }

  update(
    id: string,
    body: Partial<Insert<'folders'>>
  ): Promise<Select<'folders'>> {
    return this.service.update(id, body);
  }

  remove(
    id: string
  ): Promise<void> {
    return this.service.delete(id);
  }
}
