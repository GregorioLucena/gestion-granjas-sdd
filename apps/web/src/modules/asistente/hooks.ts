import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import type { FeedbackRecomendacion, Recomendacion } from './types';

type ListarResponse = { items: Recomendacion[] };

type DetalleResponse = {
  recomendacion: Recomendacion;
  feedback: FeedbackRecomendacion[];
};

export function useRecomendaciones(granjaActivaId: string, estado?: string) {
  return useQuery({
    queryKey: ['asistente', 'recomendaciones', granjaActivaId, estado ?? 'all'],
    enabled: !!granjaActivaId,
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('granjaId', granjaActivaId);
      if (estado) params.set('estado', estado);
      return apiFetch<ListarResponse>(`/asistente/recomendaciones?${params.toString()}`);
    },
  });
}

export function useRecomendacionDetalle(id: string | null) {
  return useQuery({
    queryKey: ['asistente', 'recomendaciones', id],
    enabled: !!id,
    queryFn: () => apiFetch<DetalleResponse>(`/asistente/recomendaciones/${id}`),
  });
}

export function useDecidirRecomendacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id: string;
      decision: 'aceptada' | 'descartada';
      motivo?: string;
    }) =>
      apiFetch<Recomendacion>(`/asistente/recomendaciones/${input.id}/decidir`, {
        method: 'PATCH',
        body: JSON.stringify({
          decision: input.decision,
          motivo: input.motivo,
        }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['asistente', 'recomendaciones'] });
    },
  });
}

export { getApiErrorMessage };
