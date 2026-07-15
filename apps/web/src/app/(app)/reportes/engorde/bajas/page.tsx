'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PERMISOS } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { EmptyState } from '@/components/data-display/empty-state';
import { PaginationBar } from '@/components/data-display/pagination-bar';
import { apiFetchReport, getApiErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import {
  defaultReportFilters,
  ReportFiltersPanel,
  SummaryCards,
  type ReportFilters,
} from '@/modules/reportes/components/report-filters-panel';
import {
  CoberturaBadge,
  GranjaRequiredState,
  ReportErrorState,
  ReportLoadingState,
} from '@/modules/reportes/components/report-states';
import { formatNullable, formatNumber } from '@/modules/reportes/format';
import { useReportFilterOptions } from '@/modules/reportes/hooks/use-report-filter-options';

type Row = {
  id: string;
  fecha: string;
  loteCodigo: string;
  cantidad: number;
  motivo: string;
  cuentaComoMortalidad: boolean;
  observaciones: string | null;
};

type Summary = {
  bajasMortalidad: number;
  otrasBajas: number;
  totalBajas: number;
  mortalidadPct: number | null;
  notaMortalidadPct: string;
};

export default function EngordeBajasReportPage() {
  const { user } = useAuth();
  return (
    <PermissionGuard permission={PERMISOS.REPORTES_ENGORDE_VER}>
      <Content granjaId={user?.granjaActivaId ?? ''} />
    </PermissionGuard>
  );
}

function Content({ granjaId }: { granjaId: string }) {
  const [filters, setFilters] = useState(defaultReportFilters);
  const [page, setPage] = useState(1);
  const options = useReportFilterOptions(granjaId);

  const reportQuery = useQuery({
    queryKey: ['reportes', 'engorde', 'bajas', granjaId, filters, page],
    enabled: !!granjaId,
    queryFn: () =>
      apiFetchReport<Row[], Summary>('/reportes/engorde/bajas', {
        granjaId,
        fechaDesde: filters.fechaDesde,
        fechaHasta: filters.fechaHasta,
        loteId: filters.loteId || undefined,
        tipoAnimalId: filters.tipoAnimalId || undefined,
        page,
        limit: 20,
      }),
  });

  if (!granjaId) return <GranjaRequiredState />;

  const summary = reportQuery.data?.summary;
  const rows = reportQuery.data?.data ?? [];
  const meta = reportQuery.data?.meta;

  return (
    <ReportFiltersPanel
      title="Bajas y mortalidad"
      description="Salidas del periodo. Solo motivos marcados cuentan como mortalidad."
      backHref="/reportes/engorde"
      applied={filters}
      lotes={options.lotes}
      tiposAnimal={options.tiposAnimal}
      onApply={(next: ReportFilters) => {
        setPage(1);
        setFilters(next);
      }}
    >
      {reportQuery.isLoading ? <ReportLoadingState /> : null}
      {reportQuery.isError ? (
        <ReportErrorState
          message={getApiErrorMessage(reportQuery.error, 'No se pudo cargar el reporte.')}
        />
      ) : null}
      {reportQuery.isSuccess && summary ? (
        <>
          <SummaryCards
            items={[
              { label: 'Mortalidad', value: String(summary.bajasMortalidad) },
              { label: 'Otras salidas', value: String(summary.otrasBajas) },
              { label: 'Total bajas', value: String(summary.totalBajas) },
              {
                label: 'Mortalidad %',
                value: formatNullable(summary.mortalidadPct, (n) => `${formatNumber(n, 1)} %`),
                hint: summary.notaMortalidadPct,
              },
            ]}
          />
          {rows.length === 0 ? (
            <EmptyState title="Sin bajas" description="No hay bajas vigentes en el periodo." />
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="rounded-2xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{row.loteCodigo}</p>
                      <p className="text-sm text-muted">
                        {row.fecha} · {row.motivo}
                      </p>
                    </div>
                    <CoberturaBadge
                      etiqueta={
                        row.cuentaComoMortalidad ? 'Cuenta como mortalidad' : 'Otra salida'
                      }
                    />
                  </div>
                  <p className="mt-3 text-sm">
                    <span className="text-muted">Cantidad:</span>{' '}
                    <span className="font-semibold">{row.cantidad}</span>
                  </p>
                  {row.observaciones ? (
                    <p className="mt-1 text-xs text-muted">{row.observaciones}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {meta?.total ? (
            <PaginationBar
              page={meta.page ?? page}
              totalPages={meta.totalPages ?? 1}
              total={meta.total}
              limit={meta.limit ?? 20}
              onPageChange={setPage}
              loading={reportQuery.isFetching}
            />
          ) : null}
        </>
      ) : null}
    </ReportFiltersPanel>
  );
}
