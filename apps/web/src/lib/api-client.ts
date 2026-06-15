import type { PaginatedResponse } from '@gestion-granjas/shared/schemas/pagination.schemas';
import { toListQueryString } from '@/lib/list-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const DEV_USER_EMAIL = process.env.NEXT_PUBLIC_DEV_USER_EMAIL ?? 'admin@demo.local';

export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  code?: string;
  message?: string;
};

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Dev-User-Email': DEV_USER_EMAIL,
      ...options?.headers,
    },
  });

  const body = await res.json();

  if (!res.ok) {
    throw body;
  }

  return body.data as T;
}

export async function apiFetchPaginated<T>(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<PaginatedResponse<T>> {
  const qs = query ? toListQueryString(query) : '';
  return apiFetch<PaginatedResponse<T>>(`${path}${qs}`);
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const body = error as ApiErrorBody;

  if (body.error?.message) {
    return body.error.message;
  }

  if (typeof body.message === 'string' && body.message.length > 0) {
    return body.message;
  }

  return fallback;
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const body = error as ApiErrorBody;
  return body.error?.code ?? body.code;
}

export { API_URL };
