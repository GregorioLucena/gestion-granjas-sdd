'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiFetchPaginated } from '@/lib/api-client';
import { inputClassName } from '@/components/forms/field';

type GranjaOption = {
  id: string;
  nombre: string;
};

function resolveGranjas(
  granjaIds: string[],
  items: GranjaOption[] | undefined,
): GranjaOption[] {
  if (items) {
    return items.filter((granja) => granjaIds.includes(granja.id));
  }

  return granjaIds.map((id) => ({ id, nombre: id.slice(0, 8) }));
}

export function GranjaSelector() {
  const { user, setGranjaActiva } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['granjas-selector', user?.companiaId],
    enabled: Boolean(user && user.granjaIds.length > 0),
    queryFn: () =>
      apiFetchPaginated<GranjaOption>('/granjas', {
        limit: 100,
        estadoRegistro: 'ACTIVO',
        companiaId: user?.companiaId,
      }),
  });

  const granjas = useMemo(
    () => (user ? resolveGranjas(user.granjaIds, data?.items) : []),
    [user, data?.items],
  );

  if (!user) {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Granja activa</p>
        <p className="text-sm font-medium">Sin sesion</p>
      </div>
    );
  }

  if (user.granjaIds.length <= 1) {
    const granja = granjas[0];
    const nombre = isLoading && !data ? 'Cargando...' : (granja?.nombre ?? 'Asignada');

    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Granja activa</p>
        <p className="text-sm font-medium">{nombre}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <label htmlFor="granja-activa" className="text-xs font-semibold uppercase tracking-wide text-primary">
        Granja activa
      </label>
      <select
        id="granja-activa"
        value={user.granjaActivaId ?? ''}
        onChange={(event) => void setGranjaActiva(event.target.value)}
        className={`${inputClassName} mt-1 max-w-full py-2 text-sm`}
      >
        <option value="" disabled>
          Seleccionar granja
        </option>
        {granjas.map((granja) => (
          <option key={granja.id} value={granja.id}>
            {granja.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
