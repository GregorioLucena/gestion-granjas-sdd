'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { EstadoFiltro } from '@/components/data-display/list-toolbar';
import { apiFetchPaginated } from '@/lib/api-client';
import { LIST_PAGE_SIZE, type PaginatedMeta } from '@gestion-granjas/shared/schemas/pagination.schemas';

type UsePaginatedListOptions = {
  queryKey: string[];
  apiPath: string;
  extraParams?: Record<string, string | undefined>;
  limit?: number;
  estadoParam?: 'estadoRegistro' | 'estado';
  enabled?: boolean;
};

export function usePaginatedList<T>({
  queryKey,
  apiPath,
  extraParams,
  limit = LIST_PAGE_SIZE,
  estadoParam = 'estadoRegistro',
  enabled = true,
}: UsePaginatedListOptions) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filtro, setFiltro] = useState<EstadoFiltro>('ACTIVO');

  const extraParamsKey = JSON.stringify(extraParams ?? {});

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filtro, extraParamsKey]);

  const query = useQuery({
    queryKey: [...queryKey, page, debouncedSearch, filtro, extraParamsKey, limit, estadoParam],
    enabled,
    queryFn: () =>
      apiFetchPaginated<T>(apiPath, {
        page,
        limit,
        search: debouncedSearch || undefined,
        [estadoParam]: filtro,
        ...extraParams,
      }),
  });

  const meta: PaginatedMeta = query.data?.meta ?? {
    page: 1,
    limit,
    total: 0,
    totalPages: 1,
  };

  return {
    items: query.data?.items ?? [],
    meta,
    page,
    setPage,
    search,
    setSearch,
    filtro,
    setFiltro,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
