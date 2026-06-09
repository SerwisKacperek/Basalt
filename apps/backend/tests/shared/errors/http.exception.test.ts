import { describe, it, expect } from 'vitest';
import { DomainException } from '@basalt/domain';

describe('DomainException', () => {
  it('sets statusCode', () => {
    expect(new DomainException(400, 'Bad request').statusCode).toBe(400);
  });

  it('sets message', () => {
    expect(new DomainException(400, 'Bad request').message).toBe('Bad request');
  });

  it('sets name to DomainException', () => {
    expect(new DomainException(500, 'err').name).toBe('DomainException');
  });

  it('is instanceof Error', () => {
    expect(new DomainException(400, 'err')).toBeInstanceOf(Error);
  });

  it('preserves arbitrary status codes', () => {
    expect(new DomainException(418, "I'm a teapot").statusCode).toBe(418);
  });
});
