import { DomainException } from './domain.exception';

export class ConflictException extends DomainException {
  constructor(message: string) {
    super(409, message);
    this.name = 'ConflictException';
  }
}
