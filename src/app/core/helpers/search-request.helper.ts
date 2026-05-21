export function createSearchRequest(searchParams: Record<string, unknown> | null = null): Record<string, unknown> {
  return {
    page: 1,
    pageSize: 1000,
    searchParams: normalizeSearchParams(searchParams),
  };
}

function normalizeSearchParams(searchParams: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!searchParams) {
    return null;
  }

  const normalized = Object.fromEntries(
    Object.entries(searchParams).filter(([, value]) => value !== null && value !== undefined && value !== ''),
  );

  return Object.keys(normalized).length ? normalized : null;
}
