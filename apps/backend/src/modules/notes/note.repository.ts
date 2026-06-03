import { eq } from 'drizzle-orm';

import type { Select, Insert } from '@/schema/types';
import type { IRepository } from "@/shared/interfaces/repository.base";
import type { Db as Database } from '@/shared/factories/db.factory';
import { buildConditions, Filters, unwrap } from '@/shared/utils';
import { schema } from '@/shared/factories/schema.factory';

export class NoteRepository implements IRepository<'notes'> {
  constructor(private db: Database) { }

  findById(
    id: string
  ): Promise<Select<'notes'> | null> {
    return this.db
      .query
      .notes
      .findFirst({ where: (w, { eq }) => eq(w.id, id) })
      .then(row => row ?? null);
  }

  findAll(
    filters?: Filters<Select<'notes'>>
  ): Promise<Select<'notes'>[]> {
    return this.db
      .select()
      .from(schema.notes)
      .where(buildConditions(schema.workspaces, filters));
  }

  create(dto: Insert<'notes'>): Promise<Select<'notes'>> {
    return this.db
      .insert(schema.notes)
      .values(dto)
      .returning()
      .then(rows => unwrap(rows[0]));
  }

  update(
    id: string,
    dto: Partial<Insert<'notes'>>
  ): Promise<Select<'notes'> | null> {
    return this.db
      .update(schema.notes)
      .set(dto)
      .where(eq(schema.notes.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }

  delete(id: string): Promise<Select<'notes'> | null> {
    return this.db
      .delete(schema.notes)
      .where(eq(schema.notes.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }
}