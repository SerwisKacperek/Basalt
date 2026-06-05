import { describe, it, expect } from 'vitest';
import { Elysia, t, NotFoundError, InternalServerError } from 'elysia';
import { errorHandler } from '@/shared/middleware/error-handler';
import { HttpException } from '@/shared/errors/http.exception';

const app = new Elysia()
  .use(errorHandler)
  .get('/http-exception', () => { throw new HttpException(403, 'Forbidden'); })
  .get('/not-found', () => { throw new NotFoundError('Resource not found'); })
  .get('/internal', () => { throw new InternalServerError(); })
  .get('/generic', () => { throw new Error('boom'); })
  .post('/validate', ({ body }) => body, {
    body: t.Object({ name: t.String() }),
  });

describe('errorHandler', () => {
  it('handles HttpException with correct status', async () => {
    const res = await app.handle(new Request('http://localhost/http-exception'));
    expect(res.status).toBe(403);
  });

  it('handles HttpException with correct message body', async () => {
    const res = await app.handle(new Request('http://localhost/http-exception'));
    expect(await res.json()).toEqual({ message: 'Forbidden' });
  });

  it('handles NotFoundError with 404', async () => {
    const res = await app.handle(new Request('http://localhost/not-found'));
    expect(res.status).toBe(404);
  });

  it('handles InternalServerError with 500', async () => {
    const res = await app.handle(new Request('http://localhost/internal'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: 'Internal server error' });
  });

  it('handles generic Error with 500', async () => {
    const res = await app.handle(new Request('http://localhost/generic'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: 'Internal server error' });
  });

  it('handles ValidationError with 422', async () => {
    const res = await app.handle(new Request('http://localhost/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.message).toBe('Validation failed');
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors.length).toBeGreaterThan(0);
  });

  it('handles ParseError with 400', async () => {
    const res = await app.handle(new Request('http://localhost/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json{{{',
    }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: 'Invalid request body' });
  });
});
