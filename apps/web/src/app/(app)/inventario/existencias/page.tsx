'use client';

import { useQuery } from '@tanstack/react-query';
import { PERMISOS } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/data-display/empty-state';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

type Existencia = {
  granjaId: string;
  almacenId: string;
  alimentoId: string;
  cantidad: number;
  almacen?: { id: string; nombre: string; codigo?: string | null };
  alimento?: {
    id: string;
    nombre: string;
    unidadMedida?: { abreviatura: string };
  };
};

function formatCantidad(cantidad: number, abreviatura?: string) {
  const value = Number.isInteger(cantidad) ? String(cantidad) : cantidad.toFixed(2);
  return abreviatura ? `${value} ${abreviatura}` : value;
}

export default function ExistenciasPage() {
  const { user } = useAuth();
  const granjaActivaId = user?.granjaActivaId ?? '';

  return (
    <PermissionGuard permission={PERMISOS.INVENTARIO_VER}>
      <ExistenciasContent granjaActivaId={granjaActivaId} />
    </PermissionGuard>
  );
}

function ExistenciasContent({ granjaActivaId }: { granjaActivaId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['existencias-inventario', granjaActivaId],
    enabled: !!granjaActivaId,
    queryFn: () =>
      apiFetch<Existencia[]>(
        `/existencias-inventario${granjaActivaId ? `?granjaId=${granjaActivaId}` : ''}`,
      ),
  });

  const existencias = data ?? [];

  if (!granjaActivaId) {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader
          backHref="/inventario"
          backLabel="Inventario"
          title="Existencias"
          description="Stock disponible por almacen y alimento."
        />
        <EmptyState
          title="Selecciona una granja activa"
          description="Usa el selector del encabezado para consultar existencias."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        backHref="/inventario"
        backLabel="Inventario"
        title="Existencias"
        description="Stock disponible en la granja activa."
      />

      {isLoading ? (
        <p className="text-sm text-muted">Cargando existencias...</p>
      ) : isError ? (
        <p className="text-sm text-danger">No se pudieron cargar las existencias.</p>
      ) : existencias.length === 0 ? (
        <EmptyState
          title="Sin stock registrado"
          description="Registra una entrada de inventario para ver existencias aqui."
        />
      ) : (
        <div className="space-y-3">
          {existencias.map((item) => (
            <article
              key={`${item.almacenId}-${item.alimentoId}`}
              className="rounded-2xl bg-white/70 p-4 ring-1 ring-primary/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {item.alimento?.nombre ?? 'Alimento'}
                  </h3>
                  <p className="text-sm text-muted">
                    {item.almacen?.nombre ?? 'Almacen'}
                    {item.almacen?.codigo ? ` · ${item.almacen.codigo}` : ''}
                  </p>
                </div>
                <p className="text-lg font-bold text-primary">
                  {formatCantidad(item.cantidad, item.alimento?.unidadMedida?.abreviatura)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
