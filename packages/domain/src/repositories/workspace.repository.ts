import { eq } from 'drizzle-orm';

import type { IRepository } from '../interfaces/repository.base';
import type { Select, Insert } from '../schema/types';
import type { Db, Schema } from '../schema/db';
import { buildConditions, Filters, unwrap } from '../utils';

export class WorkspaceRepository implements IRepository<'workspaces'> {
  constructor(private db: Db, private schema: Schema) {}

  findById(id: string): Promise<Select<'workspaces'> | null> {
    return this.db.query.workspaces
      .findFirst({ where: (w, { eq }) => eq(w.id, id) })
      .then(row => row ?? null);
  }

  findAll(filters?: Filters<Select<'workspaces'>>): Promise<Select<'workspaces'>[]> {
    return this.db.select()
      .from(this.schema.workspaces)
      .where(buildConditions(this.schema.workspaces, filters));
  }

  create(dto: Insert<'workspaces'>): Promise<Select<'workspaces'>> {
    return this.db.insert(this.schema.workspaces)
      .values(dto)
      .returning()
      .then(rows => unwrap(rows[0]));
  }

  update(id: string, dto: Partial<Insert<'workspaces'>>): Promise<Select<'workspaces'> | null> {
    return this.db.update(this.schema.workspaces)
      .set(dto)
      .where(eq(this.schema.workspaces.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }

  delete(id: string): Promise<Select<'workspaces'> | null> {
    return this.db.delete(this.schema.workspaces)
      .where(eq(this.schema.workspaces.id, id))
      .returning()
      .then(rows => rows[0] ?? null);
  }
}
