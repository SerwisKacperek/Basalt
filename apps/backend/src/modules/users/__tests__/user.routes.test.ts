import { describe, it, expect, vi } from 'vitest';
import { createUserRoutes } from '../user.routes';
import { ConflictException, NotFoundException } from '../../../shared/errors';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  password: 'hashed_SECRET_must_not_leak',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
};

const makeController = (overrides = {}) => ({
  register: vi.fn().mockResolvedValue(mockUser),
  getAll: vi.fn().mockResolvedValue([mockUser]),
  getById: vi.fn().mockResolvedValue(mockUser),
  update: vi.fn().mockResolvedValue(mockUser),
  remove: vi.fn().mockResolvedValue(undefined),
  create: vi.fn(),
  ...overrides,
});

const makeApp = (overrides = {}) =>
  createUserRoutes(null as any, makeController(overrides) as any);

const post = (app: any, path: string, body: unknown) =>
  app.handle(new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));

const patch = (app: any, path: string, body: unknown) =>
  app.handle(new Request(`http://localhost${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));

const del = (app: any, path: string) =>
  app.handle(new Request(`http://localhost${path}`, { method: 'DELETE' }));

describe('POST /users/register', () => {
  it('returns 201 on valid registration', async () => {
    const res = await post(makeApp(), '/users/register', { email: 'test@example.com', password: 'password123' });
    expect(res.status).toBe(201);
  });

  it('response does not include password', async () => {
    const res = await post(makeApp(), '/users/register', { email: 'test@example.com', password: 'password123' });
    const body = await res.json();
    expect(body.password).toBeUndefined();
  });

  it('returns 409 when email already in use', async () => {
    const res = await post(
      makeApp({ register: vi.fn().mockRejectedValue(new ConflictException("Email already in use")) }),
      '/users/register',
      { email: 'test@example.com', password: 'password123' },
    );
    expect(res.status).toBe(409);
  });

  it('returns 422 when email is missing', async () => {
    const res = await post(makeApp(), '/users/register', { password: 'password123' });
    expect(res.status).toBe(422);
  });

  it('returns 422 when password is too short', async () => {
    const res = await post(makeApp(), '/users/register', { email: 'test@example.com', password: 'short' });
    expect(res.status).toBe(422);
  });

  it('returns 422 when password is missing', async () => {
    const res = await post(makeApp(), '/users/register', { email: 'test@example.com' });
    expect(res.status).toBe(422);
  });
});

describe('GET /users', () => {
  it('returns 200 with array', async () => {
    const res = await makeApp().handle(new Request('http://localhost/users/'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('response does not include password', async () => {
    const res = await makeApp().handle(new Request('http://localhost/users/'));
    const [user] = await res.json();
    expect(user.password).toBeUndefined();
  });
});

describe('GET /users/:id', () => {
  it('returns 200 with user data', async () => {
    const res = await makeApp().handle(new Request('http://localhost/users/user-1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('user-1');
    expect(body.email).toBe('test@example.com');
  });

  it('response does not include password', async () => {
    const res = await makeApp().handle(new Request('http://localhost/users/user-1'));
    const body = await res.json();
    expect(body.password).toBeUndefined();
  });

  it('returns 404 when user not found', async () => {
    const res = await makeApp({
      getById: vi.fn().mockRejectedValue(new NotFoundException('User', 'missing-id')),
    }).handle(new Request('http://localhost/users/missing-id'));
    expect(res.status).toBe(404);
  });
});

describe('PATCH /users/:id', () => {
  it('returns 200 with updated user', async () => {
    const res = await patch(makeApp(), '/users/user-1', { email: 'new@example.com' });
    expect(res.status).toBe(200);
  });

  it('response does not include password', async () => {
    const res = await patch(makeApp(), '/users/user-1', { email: 'new@example.com' });
    const body = await res.json();
    expect(body.password).toBeUndefined();
  });

  it('returns 404 when user not found', async () => {
    const res = await patch(
      makeApp({ update: vi.fn().mockRejectedValue(new NotFoundException('User', 'missing-id')) }),
      '/users/missing-id',
      { email: 'new@example.com' },
    );
    expect(res.status).toBe(404);
  });
});

describe('DELETE /users/:id', () => {
  it('returns 200 when user deleted', async () => {
    const res = await del(makeApp(), '/users/user-1');
    expect(res.status).toBe(200);
  });

  it('returns 404 when user not found', async () => {
    const res = await del(
      makeApp({ remove: vi.fn().mockRejectedValue(new NotFoundException('User', 'missing-id')) }),
      '/users/missing-id',
    );
    expect(res.status).toBe(404);
  });
});
