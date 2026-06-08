import type { Select, Insert, Filters } from '@basalt/domain';
import type { IController } from '../../shared/interfaces/controller.base';
import type { NoteService } from '@basalt/domain';

export class NoteController implements IController<'notes'> {
  constructor(private service: NoteService) { }

  getById(id: string): Promise<Select<'notes'>> {
    return this.service.findById(id);
  }

  getAll(
    filters?: Filters<Select<'notes'>>
  ): Promise<Select<'notes'>[]> {
    return this.service.findAll(filters);
  }

  create(
    body: Insert<'notes'>
  ): Promise<Select<'notes'>> {
    return this.service.create(body);
  }

  update(
    id: string,
    body: Partial<Insert<'notes'>>
  ): Promise<Select<'notes'>> {
    return this.service.update(id, body);
  }

  remove(id: string): Promise<void> {
    return this.service.delete(id);
  }
}