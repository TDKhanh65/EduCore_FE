export function unwrapApiData(value: unknown): unknown {
  const record = toRecord(value);
  return record && 'data' in record ? record['data'] : value;
}

export function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
