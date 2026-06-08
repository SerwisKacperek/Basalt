import { eq } from 'drizzle-orm';

import type { IRepository } from '../interfaces/repository.base';
import type { Select, Insert } from '../schema/types';
import type { Db, Schema } from '../schema/db';
import { buildConditions, Filters, unwrap } from '../utils';

export class FolderRepository implements IRepository<'folders'> {
  constructor(private db: Db, private schema: Schema) {}

  findById(id: string): Promise<Select<'folders'> | null> {
    return this.db.query.folders
      .findFirst({ where: (f, { eq }) => eq(f.id, id) })
      .then(row => row ?? null);
  }

  findAll(filters?: Filters<Select<'folders'>>): Promise<Select<'folders'>[]> {
    return this.db.select()
      .from(this.schema.folders)
      .where(buildConditions(this.schema.folders, filters));
  }

  create(dto: Insert<'folders'>): Promise<Select<'folders'>> {
    return this.db.insert(this.schema.folders)
      .values(dto)
      .returning()
      .then(rows => unwrap(rows[0]));
  }

  update(id: string, dto: Partial<Insert<'folders'>>): Promise<Select<'folders'> | null> {
    return this.db.update(this.schema.folders)
      .set(dto)
      .where(eq(this.schema.folders.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }

  delete(id: string): Promise<Select<'folders'> | null> {
    return this.db.delete(this.schema.folders)
      .where(eq(this.schema.folders.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }
}
