/**
 * Asserts that a value is non-null and non-undefined, throwing if it is.
 * Use after mutating queries (insert, update) where an empty result means failure.
 *
 * Do NOT use for read queries where "not found" is a valid outcome — return `null` there instead.
 *
 * @param value - The value to assert
 * @throws {Error} if value is null or undefined
 *
 * @example
 * const row = await db.insert(schema.workspaces).values(dto).returning().then(rows => unwrap(rows[0]));
 */
export function unwrap<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Query returned no result');
  return value;
}
