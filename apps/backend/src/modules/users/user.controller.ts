import type { Select, Insert, Filters } from '@basalt/domain';
import type { IController } from '../../shared/interfaces/controller.base';
import type { UserService } from './user.service';

export class UserController implements IController<'users'> {
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

  register(email: string, password: string): Promise<Select<'users'>> {
    return this.service.register(email, password);
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