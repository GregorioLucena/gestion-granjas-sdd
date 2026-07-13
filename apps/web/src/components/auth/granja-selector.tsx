'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
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
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <MapPin className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-muted">Granja activa</p>
          <p className="text-sm font-semibold">Sin sesion</p>
        </div>
      </div>
    );
  }

  if (user.granjaIds.length <= 1) {
    const granja = granjas[0];
    const nombre = isLoading && !data ? 'Cargando...' : (granja?.nombre ?? 'Asignada');

    return (
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <MapPin className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-muted">Granja activa</p>
          <p className="truncate text-sm font-semibold text-foreground">{nombre}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
        <MapPin className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <label
          htmlFor="granja-activa"
          className="text-[11px] font-semibold tracking-wide text-muted"
        >
          Granja activa
        </label>
        <select
          id="granja-activa"
          value={user.granjaActivaId ?? ''}
          onChange={(event) => void setGranjaActiva(event.target.value)}
          className={`${inputClassName} mt-0.5 max-w-full py-1.5 text-sm font-semibold`}
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
    </div>
  );
}
