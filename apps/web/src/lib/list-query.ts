import type { ListQuery } from '@gestion-granjas/shared/schemas/pagination.schemas';

export function toListQueryString(
  params: Partial<ListQuery> & Record<string, string | number | undefined>,
): string {
  const sp = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      sp.set(key, String(value));
    }
  }

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}
