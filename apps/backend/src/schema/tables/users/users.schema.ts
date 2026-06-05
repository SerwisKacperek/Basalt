import { t } from 'elysia';
import { createSelectSchema, createUpdateSchema } from 'drizzle-typebox';

import { schema } from '../../../shared/factories/schema.factory';

const createUserSelectSchema: any = createSelectSchema;
const createUserUpdateSchema: any = createUpdateSchema;

const users = schema.users;

export const UserResponse = t.Omit(
  createUserSelectSchema(users),
  ['password'],
);

export const UserRegisterBody = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 8 }),
});

export const UserUpdateBody = t.Omit(
  createUserUpdateSchema(users),
  ['password', 'id', 'createdAt', 'updatedAt'],
);
