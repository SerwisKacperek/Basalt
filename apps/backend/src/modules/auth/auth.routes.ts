import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';

import type { Db } from '../../shared/factories/db.factory';
import { schema } from '../../shared/factories/schema.factory';
import { errorHandler } from '../../shared/middleware';
import { UserResponse } from '../../schema/tables/users/users.schema';
import { UserRepository } from '@basalt/domain';

const LoginBody = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 1 }),
});

const RegisterBody = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 8 }),
});

const COOKIE_NAME = 'auth_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function unauthorized(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const createAuthRoutes = (db: Db) => {
  const userRepo = new UserRepository(db as any, schema);

  return new Elysia({ prefix: '/auth' })
    .use(errorHandler)
    .use(
      jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET!,
      }),
    )
    .post(
      '/register',
      async ({ jwt, cookie, body }) => {
        const existing = await userRepo.findByEmail(body.email);
        if (existing) {
          return new Response(JSON.stringify({ error: 'Email already in use' }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const hashed = await Bun.password.hash(body.password);
        const user = await userRepo.create({ email: body.email, password: hashed });

        const token = await jwt.sign({ sub: user.id, email: user.email });
        cookie[COOKIE_NAME]?.set({
          value: token,
          httpOnly: true,
          maxAge: COOKIE_MAX_AGE,
          path: '/',
          sameSite: 'lax',
        });

        const { password: _p, ...userResponse } = user;
        return userResponse;
      },
      {
        body: RegisterBody,
        response: { 200: UserResponse },
      },
    )
    .post(
      '/login',
      async ({ jwt, cookie, body }) => {
        const user = await userRepo.findByEmail(body.email);
        if (!user) return unauthorized('Invalid credentials');

        const valid = await Bun.password.verify(body.password, user.password);
        if (!valid) return unauthorized('Invalid credentials');

        const token = await jwt.sign({ sub: user.id, email: user.email });
        cookie[COOKIE_NAME]?.set({
          value: token,
          httpOnly: true,
          maxAge: COOKIE_MAX_AGE,
          path: '/',
          sameSite: 'lax',
        });

        const { password: _p, ...userResponse } = user;
        return userResponse;
      },
      {
        body: LoginBody,
        response: { 200: UserResponse },
      },
    )
    .post('/logout', ({ cookie }) => {
      cookie[COOKIE_NAME]?.remove();
      return { success: true };
    })
    .get(
      '/me',
      async ({ jwt, cookie }) => {
        const tokenValue = cookie[COOKIE_NAME]?.value;
        if (!tokenValue) return unauthorized('Not authenticated');

        const payload = await jwt.verify(tokenValue as string);
        if (!payload || typeof payload.sub !== 'string') return unauthorized('Invalid token');

        const user = await userRepo.findById(payload.sub);
        if (!user) return unauthorized('User not found');

        const { password: _p, ...userResponse } = user;
        return userResponse;
      },
      {
        response: { 200: UserResponse },
      },
    );
};
