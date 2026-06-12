import { describe, it, expect } from 'vitest';
import { NotFoundException, DomainException } from '@basalt/domain';

describe('NotFoundException', () => {
  it('sets statusCode 404', () => {
    expect(new NotFoundException('Workspace', '1').statusCode).toBe(404);
  });

  it('formats message with entity and id', () => {
    expect(new NotFoundException('Workspace', 'abc').message).toBe("Workspace with id 'abc' not found");
  });

  it('sets name to NotFoundException', () => {
    expect(new NotFoundException('X', '1').name).toBe('NotFoundException');
  });

  it('is instanceof DomainException', () => {
    expect(new NotFoundException('X', '1')).toBeInstanceOf(DomainException);
  });

  it('is instanceof Error', () => {
    expect(new NotFoundException('X', '1')).toBeInstanceOf(Error);
  });
});
