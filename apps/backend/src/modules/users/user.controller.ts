import type { Select, Insert } from '../../schema/types';
import type { IController } from '../../shared/interfaces/controller.base';
import type { Filters } from '../../shared/utils';
import type { UserService } from './user.service';

export class NoteController implements IController<'users'> {
  constructor(private service: UserService) { }

  getById(id: string): Promise<Select<'users'>> {
    return this.service.findById(id);
  }

  getAll(
    filters?: Filters<Select<'users'>>
  ): Promise<Select<'users'>[]> {
    return this.service.findAll(filters);
  }

  create(
    body: Insert<'users'>
  ): Promise<Select<'users'>> {
    return this.service.create(body);
  }

  update(
    id: string,
    body: Partial<Insert<'users'>>
  ): Promise<Select<'users'>> {
    return this.service.update(id, body);
  }

  remove(id: string): Promise<void> {
    return this.service.delete(id);
  }
}