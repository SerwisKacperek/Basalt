import { eq } from 'drizzle-orm';

import type { IRepository } from '../interfaces/repository.base';
import type { Select, Insert } from '../schema/types';
import type { Db, Schema } from '../schema/db';
import { buildConditions, Filters, unwrap } from '../utils';

export class NoteRepository implements IRepository<'notes'> {
  constructor(private db: Db, private schema: Schema) {}

  findById(id: string): Promise<Select<'notes'> | null> {
    return this.db.query.notes
      .findFirst({ where: (n, { eq }) => eq(n.id, id) })
      .then(row => row ?? null);
  }

  findAll(filters?: Filters<Select<'notes'>>): Promise<Select<'notes'>[]> {
    return this.db.select()
      .from(this.schema.notes)
      .where(buildConditions(this.schema.notes, filters));
  }

  create(dto: Insert<'notes'>): Promise<Select<'notes'>> {
    return this.db.insert(this.schema.notes)
      .values(dto)
      .returning()
      .then(rows => unwrap(rows[0]));
  }

  update(id: string, dto: Partial<Insert<'notes'>>): Promise<Select<'notes'> | null> {
    return this.db.update(this.schema.notes)
      .set(dto)
      .where(eq(this.schema.notes.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }

  delete(id: string): Promise<Select<'notes'> | null> {
    return this.db.delete(this.schema.notes)
      .where(eq(this.schema.notes.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }
}
