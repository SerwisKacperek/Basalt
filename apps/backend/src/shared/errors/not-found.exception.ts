import { HttpException } from './http.exception';

export class NotFoundException extends HttpException {
  constructor(entity: string, id: string) {
    super(404, `${entity} with id '${id}' not found`);
    this.name = 'NotFoundException';
  }
}
