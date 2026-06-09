import { eq } from 'drizzle-orm';

import type { IRepository } from '../interfaces/repository.base';
import type { Select, Insert } from '../schema/types';
import type { Db, Schema } from '../schema/db';
import { buildConditions, Filters, unwrap } from '../utils';

export class UserRepository implements IRepository<'users'> {
  constructor(private db: Db, private schema: Schema) {}

  findByEmail(email: string): Promise<Select<'users'> | null> {
    return this.db.query.users
      .findFirst({ where: (u) => eq(u.email, email) })
      .then(row => row ?? null);
  }

  findById(id: string): Promise<Select<'users'> | null> {
    return this.db.query.users
      .findFirst({ where: (u) => eq(u.id, id) })
      .then(row => row ?? null);
  }

  findAll(filters?: Filters<Select<'users'>>): Promise<Select<'users'>[]> {
    return this.db.select()
      .from(this.schema.users)
      .where(buildConditions(this.schema.users, filters));
  }

  create(dto: Insert<'users'>): Promise<Select<'users'>> {
    return this.db.insert(this.schema.users)
      .values(dto)
      .returning()
      .then(rows => unwrap(rows[0]));
  }

  update(id: string, dto: Partial<Insert<'users'>>): Promise<Select<'users'> | null> {
    return this.db.update(this.schema.users)
      .set(dto)
      .where(eq(this.schema.users.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }

  delete(id: string): Promise<Select<'users'> | null> {
    return this.db.delete(this.schema.users)
      .where(eq(this.schema.users.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }
}
