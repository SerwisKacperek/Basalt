import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { UserService } from '../user.service';
import { NotFoundException, ConflictException } from '../../../shared/errors';

beforeAll(() => {
  vi.stubGlobal('Bun', {
    password: {
      hash: vi.fn().mockImplementation((pw: string) => Promise.resolve(`hashed:${pw}`)),
      verify: vi.fn().mockImplementation((pw: string, hash: string) => Promise.resolve(hash === `hashed:${pw}`)),
    },
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  password: 'hashed_password',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
};

const makeRepo = (overrides = {}) => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

describe('UserService.findById', () => {
  it('returns user when found', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(mockUser) });
    const service = new UserService(repo as any);
    await expect(service.findById('user-1')).resolves.toEqual(mockUser);
  });

  it('throws NotFoundException when not found', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) });
    const service = new UserService(repo as any);
    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('UserService.findAll', () => {
  it('delegates to repository', async () => {
    const repo = makeRepo({ findAll: vi.fn().mockResolvedValue([mockUser]) });
    const service = new UserService(repo as any);
    await expect(service.findAll()).resolves.toEqual([mockUser]);
  });
});

describe('UserService.register', () => {
  it('throws ConflictException when email already in use', async () => {
    const repo = makeRepo({ findByEmail: vi.fn().mockResolvedValue(mockUser) });
    const service = new UserService(repo as any);
    await expect(service.register('test@example.com', 'password123')).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not call create when email already in use', async () => {
    const repo = makeRepo({
      findByEmail: vi.fn().mockResolvedValue(mockUser),
      create: vi.fn(),
    });
    const service = new UserService(repo as any);
    await service.register('test@example.com', 'password123').catch(() => { });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('stores hashed password, not plaintext', async () => {
    const repo = makeRepo({
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(mockUser),
    });
    const service = new UserService(repo as any);
    await service.register('new@example.com', 'password123');

    const dto = repo.create.mock.calls[0]?.[0];
    expect(dto.password).not.toBe('password123');
    await expect(Bun.password.verify('password123', dto.password)).resolves.toBe(true);
  });

  it('passes correct email to create', async () => {
    const repo = makeRepo({
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(mockUser),
    });
    const service = new UserService(repo as any);
    await service.register('new@example.com', 'password123');

    const dto = repo.create.mock.calls[0]?.[0];
    expect(dto.email).toBe('new@example.com');
  });
});

describe('UserService.update', () => {
  it('returns updated user', async () => {
    const updated = { ...mockUser, email: 'new@example.com' };
    const repo = makeRepo({ update: vi.fn().mockResolvedValue(updated) });
    const service = new UserService(repo as any);
    await expect(service.update('user-1', { email: 'new@example.com' })).resolves.toEqual(updated);
  });

  it('throws NotFoundException when user not found', async () => {
    const repo = makeRepo({ update: vi.fn().mockResolvedValue(null) });
    const service = new UserService(repo as any);
    await expect(service.update('missing', {})).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('UserService.delete', () => {
  it('resolves when user deleted', async () => {
    const repo = makeRepo({ delete: vi.fn().mockResolvedValue(mockUser) });
    const service = new UserService(repo as any);
    await expect(service.delete('user-1')).resolves.toBeUndefined();
  });

  it('throws NotFoundException when user not found', async () => {
    const repo = makeRepo({ delete: vi.fn().mockResolvedValue(null) });
    const service = new UserService(repo as any);
    await expect(service.delete('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
