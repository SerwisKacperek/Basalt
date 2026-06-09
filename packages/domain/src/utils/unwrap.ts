export function unwrap<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Query returned no result');
  return value;
}
