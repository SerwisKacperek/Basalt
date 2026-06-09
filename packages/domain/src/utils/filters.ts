import { and, eq, gt, gte, lt, lte } from 'drizzle-orm';
import type { SQL, Table } from 'drizzle-orm';

type FilterOperators<T> = {
  eq?: T;
  gt?: T;
  gte?: T;
  lt?: T;
  lte?: T;
};

export type FilterValue<T> = T | FilterOperators<T>;

export type Filters<T extends Record<string, any>> = {
  [K in keyof T]?: FilterValue<T[K]>;
};

function isOperatorObject(value: unknown): value is FilterOperators<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !(value instanceof Date) &&
    !Array.isArray(value)
  );
}

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
