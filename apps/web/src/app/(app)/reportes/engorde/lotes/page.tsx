'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PERMISOS } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { EmptyState } from '@/components/data-display/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { apiFetchPaginated, getApiErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import {
  GranjaRequiredState,
  ReportErrorState,
  ReportLoadingState,
} from '@/modules/reportes/components/report-states';

type Engorde = {
  id: string;
  loteId: string;
  estado: string;
  fechaInicio: string;
  lote?: { codigo: string };
};

export default function EngordeLotesIndexPage() {
  const { user } = useAuth();
  return (
    <PermissionGuard permission={PERMISOS.REPORTES_ENGORDE_VER}>
      <Content granjaId={user?.granjaActivaId ?? ''} />
    </PermissionGuard>
  );
}

function Content({ granjaId }: { granjaId: string }) {
  const listQuery = useQuery({
    queryKey: ['engordes', 'reportes-lote-index', granjaId],
    enabled: !!granjaId,
    queryFn: () =>
      apiFetchPaginated<Engorde>('/engordes', {
        page: 1,
        limit: 50,
        granjaId,
      }),
  });

  if (!granjaId) return <GranjaRequiredState />;

  const items = listQuery.data?.items ?? [];

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/reportes/engorde"
        backLabel="Reportes"
        title="Resumen por lote"
        description="Elige un lote con engorde para ver controles, bajas e indicadores."
      />

      {listQuery.isLoading ? <ReportLoadingState /> : null}
      {listQuery.isError ? (
        <ReportErrorState
          message={getApiErrorMessage(listQuery.error, 'No se pudieron cargar los engordes.')}
        />
      ) : null}
      {listQuery.isSuccess ? (
        items.length === 0 ? (
          <EmptyState
            title="Sin engordes"
            description="No hay procesos de engorde en la granja activa."
          />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/reportes/engorde/lotes/${item.loteId}`}
                  className="flex items-center justify-between rounded-2xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10"
                >
                  <span>
                    <span className="block font-semibold">{item.lote?.codigo ?? item.loteId}</span>
                    <span className="text-sm text-muted">
                      {item.estado} · inicio {item.fechaInicio}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-primary">Abrir</span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
