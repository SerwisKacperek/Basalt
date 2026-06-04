import { eq } from 'drizzle-orm';

import type { Select, Insert } from '../../schema/types';
import type { IRepository } from '../../shared/interfaces/repository.base';
import type { Filters } from '../../shared/utils/filters';
import type { Db as Database } from '../../shared/factories/db.factory';
import { schema } from '../../shared/factories/schema.factory';
import { buildConditions } from '../../shared/utils/filters';
import { unwrap } from '../../shared/utils';

export class WorkspaceRepository implements IRepository<'workspaces'> {
  constructor(private db: Database) { }

  findById(id: string): Promise<Select<'workspaces'> | null> {
    return this.db
      .query
      .workspaces
      .findFirst({ where: (w, { eq }) => eq(w.id, id) })
      .then(row => row ?? null);
  }

  findAll(filters?: Filters<Select<'workspaces'>>): Promise<Select<'workspaces'>[]> {
    return this.db
      .select()
      .from(schema.workspaces)
      .where(buildConditions(schema.workspaces, filters));
  }

  create(dto: Insert<'workspaces'>): Promise<Select<'workspaces'>> {
    return this.db
      .insert(schema.workspaces)
      .values(dto)
      .returning()
      .then(rows => unwrap(rows[0]));
  }

  update(
    id: string,
    dto: Partial<Insert<"workspaces">>
  ): Promise<Select<"workspaces"> | null> {
    return this.db
      .update(schema.workspaces)
      .set(dto)
      .where(eq(schema.workspaces.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }

  delete(id: string): Promise<Select<'workspaces'> | null> {
    return this.db
      .delete(schema.workspaces)
      .where(eq(schema.workspaces.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }
}