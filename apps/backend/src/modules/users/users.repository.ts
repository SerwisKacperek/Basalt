import { eq } from 'drizzle-orm';

import type { Select, Insert } from '../../schema/types';
import type { IRepository } from '../../shared/interfaces/repository.base';
import type { Db as Database } from '../../shared/factories/db.factory';
import { buildConditions, Filters, unwrap } from '../../shared/utils';
import { schema } from '../../shared/factories/schema.factory';

export class UserRepository implements IRepository<'users'> {
  constructor(private db: Database) { }

  findById(
    id: string
  ): Promise<Select<'users'> | null> {
    return this.db
      .query
      .users
      .findFirst({ where: (u) => eq(u.id, id) })
      .then(row => row ?? null);
  }

  findAll(
    filters: Filters<Select<'users'>>
  ): Promise<Select<'users'>[]> {
    return this.db
      .select()
      .from(schema.users)
      .where(buildConditions(schema.users, filters));
  }

  create(
    dto: Insert<'users'>
  ): Promise<Select<'users'>> {
    return this.db
      .insert(schema.users)
      .values(dto)
      .returning()
      .then(rows => unwrap(rows[0]));
  }

  update(
    id: string,
    dto: Partial<Insert<'users'>>
  ): Promise<Select<'users'> | null> {
    return this.db
      .update(schema.users)
      .set(dto)
      .where(eq(schema.users.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }

  delete(
    id: string,
  ): Promise<Select<'users'> | null> {
    return this.db
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }
}