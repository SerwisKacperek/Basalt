import {
  Elysia,
  ValidationError,
  ParseError,
  NotFoundError,
  InternalServerError
} from 'elysia';

import { HttpException } from '../errors';

export const errorHandler = new Elysia({ name: 'error-handler' })
  .onError({ as: 'global' }, ({ error, set }) => {
    if (error instanceof HttpException) {
      set.status = error.statusCode;
      return { message: error.message };
    }

    if (error instanceof ValidationError) {
      set.status = 422;
      return {
        message: 'Validation failed',
        errors: error.all.map((e) => ({ path: e.path, message: e.message })),
      };
    }

    if (error instanceof ParseError) {
      set.status = 400;
      return { message: 'Invalid request body' };
    }

    if (error instanceof NotFoundError) {
      set.status = 404;
      return { message: error.message || 'Not found' };
    }

    if (error instanceof InternalServerError) {
      set.status = 500;
      return { message: 'Internal server error' };
    }

    set.status = 500;
    return { message: 'Internal server error' };
  });
