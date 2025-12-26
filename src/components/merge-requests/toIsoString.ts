export function toIsoString(input: unknown): string | null {
  if (!input) return null;
  if (typeof input === 'string') return input;
  if (typeof input === 'number') return new Date(input).toISOString();
  if (input instanceof Date) return input.toISOString();
  return null;
}


