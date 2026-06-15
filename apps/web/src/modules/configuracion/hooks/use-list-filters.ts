'use client';

import { useMemo, useState } from 'react';
import type { EstadoFiltro } from '@/components/data-display/list-toolbar';

type FilterableRecord = {
  nombre: string;
  estadoRegistro?: string;
};

export function useListFilters<T extends FilterableRecord>(items: T[]) {
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<EstadoFiltro>('ACTIVO');

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch = !query || item.nombre.toLowerCase().includes(query);
      const matchesEstado =
        filtro === 'TODOS' ||
        (item.estadoRegistro ?? 'ACTIVO') === filtro;

      return matchesSearch && matchesEstado;
    });
  }, [items, search, filtro]);

  return {
    search,
    setSearch,
    filtro,
    setFiltro,
    filteredItems,
  };
}
