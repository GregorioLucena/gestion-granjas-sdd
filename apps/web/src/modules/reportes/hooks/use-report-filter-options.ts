'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetchPaginated } from '@/lib/api-client';

type Named = { id: string; nombre: string };
type Lote = { id: string; codigo: string };

export function useReportFilterOptions(granjaId: string) {
  const lotesQuery = useQuery({
    queryKey: ['lotes', 'reportes-select', granjaId],
    enabled: !!granjaId,
    queryFn: () =>
      apiFetchPaginated<Lote>('/lotes', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
        granjaId,
      }),
  });

  const alimentosQuery = useQuery({
    queryKey: ['alimentos', 'reportes-select'],
    enabled: !!granjaId,
    queryFn: () =>
      apiFetchPaginated<Named>('/alimentos', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const almacenesQuery = useQuery({
    queryKey: ['almacenes', 'reportes-select', granjaId],
    enabled: !!granjaId,
    queryFn: () =>
      apiFetchPaginated<Named>('/almacenes', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
        granjaId,
      }),
  });

  const tiposAnimalQuery = useQuery({
    queryKey: ['tipos-animal', 'reportes-select'],
    enabled: !!granjaId,
    queryFn: () =>
      apiFetchPaginated<Named>('/tipos-animal', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  return {
    lotes: (lotesQuery.data?.items ?? []).map((item) => ({
      id: item.id,
      label: item.codigo,
    })),
    alimentos: (alimentosQuery.data?.items ?? []).map((item) => ({
      id: item.id,
      label: item.nombre,
    })),
    almacenes: (almacenesQuery.data?.items ?? []).map((item) => ({
      id: item.id,
      label: item.nombre,
    })),
    tiposAnimal: (tiposAnimalQuery.data?.items ?? []).map((item) => ({
      id: item.id,
      label: item.nombre,
    })),
  };
}
