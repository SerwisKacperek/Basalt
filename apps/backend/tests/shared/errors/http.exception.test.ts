import { describe, it, expect } from 'vitest';
import { HttpException } from '@/shared/errors/http.exception';

describe('HttpException', () => {
  it('sets statusCode', () => {
    expect(new HttpException(400, 'Bad request').statusCode).toBe(400);
  });

  it('sets message', () => {
    expect(new HttpException(400, 'Bad request').message).toBe('Bad request');
  });

  it('sets name to HttpException', () => {
    expect(new HttpException(500, 'err').name).toBe('HttpException');
  });

  it('is instanceof Error', () => {
    expect(new HttpException(400, 'err')).toBeInstanceOf(Error);
  });

  it('preserves arbitrary status codes', () => {
    expect(new HttpException(418, "I'm a teapot").statusCode).toBe(418);
  });
});
