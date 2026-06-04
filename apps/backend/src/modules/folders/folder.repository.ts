import { eq } from "drizzle-orm";

import type { Select, Insert } from '../../schema/types';
import type { Db as Database } from '../../shared/factories/db.factory';
import { buildConditions, Filters, unwrap } from '../../shared/utils';
import { IRepository } from "@/shared/interfaces/repository.base";
import { schema } from '../../shared/factories/schema.factory';

export class FolderRepository implements IRepository<'folders'> {
  constructor(private db: Database) { }

  findById(
    id: string
  ): Promise<Select<'folders'> | null> {
    return this.db
      .query
      .notes
      .findFirst({ where: (f, { eq }) => eq(f.id, id) })
      .then(row => row ?? null);
  }

  findAll(
    filters?: Filters<Select<'folders'>> | undefined
  ): Promise<Select<'folders'>[]> {
    return this.db
      .select()
      .from(schema.folders)
      .where(buildConditions(schema.folders, filters));
  }

  create(
    dto: Insert<'folders'>
  ): Promise<Select<'folders'>> {
    return this.db
      .insert(schema.folders)
      .values(dto)
      .returning()
      .then(rows => unwrap(rows[0]));
  }

  update(
    id: string,
    dto: Partial<Insert<'folders'>>
  ): Promise<Select<'folders'> | null> {
    return this.db
      .update(schema.folders)
      .set(dto)
      .where(eq(schema.folders.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }

  delete(id: string): Promise<Select<'folders'> | null> {
    return this.db
      .delete(schema.folders)
      .where(eq(schema.folders.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }
}