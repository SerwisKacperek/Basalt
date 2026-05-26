import { and, eq, gt, gte, lt, lte } from 'drizzle-orm';
import type { SQL, Table } from 'drizzle-orm';

/**
 * Operator-based filter for a single field.
 * All operators are optional and combined with AND when multiple are provided.
 *
 * @example
 * { gte: new Date('2024-01-01'), lt: new Date('2025-01-01') }
 */
type FilterOperators<T> = {
  eq?: T;
  gt?: T;
  gte?: T;
  lt?: T;
  lte?: T;
};

/**
 * A field filter - either a plain equality value or an operator object.
 *
 * @example
 * 'active'                          // equality
 * { gte: new Date('2024-01-01') }   // range
 */
export type FilterValue<T> = T | FilterOperators<T>;

/**
 * Filter map for any entity type. Each key is optional.
 * Pass a plain value for equality or an operator object for range/comparison.
 *
 * @example
 * const filters: Filters<Workspace> = {
 *   name: 'My Workspace',
 *   deletedAt: null,
 *   createdAt: { gte: new Date('2024-01-01') },
 * };
 */
export type Filters<T extends Record<string, any>> = {
  [K in keyof T]?: FilterValue<T[K]>;
};

/** Returns true for plain operator objects, excluding Date and arrays. */
function isOperatorObject(value: unknown): value is FilterOperators<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !(value instanceof Date) &&
    !Array.isArray(value)
  );
}

/**
 * Converts a `Filters` map into a drizzle `SQL` condition for use in `.where()`.
 * Returns `undefined` when filters are absent or empty (drizzle omits the WHERE clause).
 *
 * All active conditions are joined with AND.
 * Keys not present on the table are silently ignored.
 *
 * @param table   - Drizzle table object (e.g. `schema.workspaces`)
 * @param filters - Optional filter map
 * @returns Drizzle SQL condition or undefined
 *
 * @example
 * // Equality + range
 * db.select().from(schema.notes).where(
 *   buildConditions(schema.notes, {
 *     deletedAt: null,
 *     createdAt: { gte: new Date('2024-01-01'), lt: new Date('2025-01-01') },
 *   })
 * );
 */
export function buildConditions<T extends Table>(
  table: T,
  filters?: Filters<Record<string, any>>
): SQL | undefined {
  if (!filters) return undefined;

  const conditions: SQL[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;

    const column = (table as any)[key];
    if (!column) continue;

    if (isOperatorObject(value)) {
      if (value.eq !== undefined) conditions.push(eq(column, value.eq));
      if (value.gt !== undefined) conditions.push(gt(column, value.gt));
      if (value.gte !== undefined) conditions.push(gte(column, value.gte));
      if (value.lt !== undefined) conditions.push(lt(column, value.lt));
      if (value.lte !== undefined) conditions.push(lte(column, value.lte));
    } else {
      conditions.push(eq(column, value));
    }
  }

  return conditions.length ? and(...conditions) : undefined;
}
