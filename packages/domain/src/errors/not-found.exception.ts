import { DomainException } from './domain.exception';

export class NotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(404, `${entity} with id '${id}' not found`);
    this.name = 'NotFoundException';
  }
}
