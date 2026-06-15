import type { PaginatedResponse } from '@gestion-granjas/shared/schemas/pagination.schemas';
import { toListQueryString } from '@/lib/list-query';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/auth-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  code?: string;
  message?: string;
};

type ApiFetchOptions = RequestInit & {
  skipAuth?: boolean;
};

export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const { skipAuth, ...requestOptions } = options ?? {};
  const token = skipAuth ? null : getAccessToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...requestOptions.headers,
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

export { API_URL, clearAccessToken, getAccessToken, setAccessToken };
