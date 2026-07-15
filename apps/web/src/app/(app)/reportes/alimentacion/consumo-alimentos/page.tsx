'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PERMISOS } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { EmptyState } from '@/components/data-display/empty-state';
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
import { formatKg, formatMoney, formatNumber } from '@/modules/reportes/format';
import { useReportFilterOptions } from '@/modules/reportes/hooks/use-report-filter-options';

type Row = {
  alimentoNombre: string;
  cantidadKg: number;
  cantidadLotes: number;
  costoConocido: number;
  etiquetaCosto: string;
};

type Summary = {
  cantidadTotalKg: number;
  costoConocido: number;
  cantidadConCosto: number;
  cantidadSinCosto: number;
  coberturaCostoPct: number | null;
  etiquetaCosto: string;
};

export default function ConsumoAlimentosReportPage() {
  const { user } = useAuth();
  return (
    <PermissionGuard permission={PERMISOS.REPORTES_ALIMENTACION_VER}>
      <Content granjaId={user?.granjaActivaId ?? ''} />
    </PermissionGuard>
  );
}

function Content({ granjaId }: { granjaId: string }) {
  const [filters, setFilters] = useState(defaultReportFilters);
  const options = useReportFilterOptions(granjaId);

  const reportQuery = useQuery({
    queryKey: ['reportes', 'alimentacion', 'consumo-alimentos', granjaId, filters],
    enabled: !!granjaId,
    queryFn: () =>
      apiFetchReport<Row[], Summary>('/reportes/alimentacion/consumo-alimentos', {
        granjaId,
        fechaDesde: filters.fechaDesde,
        fechaHasta: filters.fechaHasta,
        loteId: filters.loteId || undefined,
        alimentoId: filters.alimentoId || undefined,
        almacenId: filters.almacenId || undefined,
      }),
  });

  if (!granjaId) return <GranjaRequiredState />;

  const summary = reportQuery.data?.summary;
  const rows = reportQuery.data?.data ?? [];

  return (
    <ReportFiltersPanel
      title="Consumo por alimento"
      description="Agregado por alimento con lotes alcanzados y cobertura de costo."
      applied={filters}
      lotes={options.lotes}
      alimentos={options.alimentos}
      almacenes={options.almacenes}
      onApply={(next: ReportFilters) => setFilters(next)}
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
              { label: 'Cantidad total', value: formatKg(summary.cantidadTotalKg) },
              {
                label: 'Costo conocido',
                value: formatMoney(summary.costoConocido),
                hint: summary.etiquetaCosto,
              },
              {
                label: 'Cobertura',
                value:
                  summary.coberturaCostoPct === null
                    ? '—'
                    : `${formatNumber(summary.coberturaCostoPct, 1)} %`,
              },
              { label: 'Sin costo', value: formatKg(summary.cantidadSinCosto) },
            ]}
          />
          {rows.length === 0 ? (
            <EmptyState
              title="Sin consumos en el periodo"
              description="Prueba ampliando el rango o quitando filtros."
            />
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => (
                <li
                  key={row.alimentoNombre}
                  className="rounded-2xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{row.alimentoNombre}</p>
                      <p className="text-sm text-muted">{row.cantidadLotes} lote(s)</p>
                    </div>
                    <CoberturaBadge etiqueta={row.etiquetaCosto} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <p>
                      <span className="text-muted">Cantidad</span>
                      <br />
                      <span className="font-semibold">{formatKg(row.cantidadKg)}</span>
                    </p>
                    <p>
                      <span className="text-muted">Costo conocido</span>
                      <br />
                      <span className="font-semibold">{formatMoney(row.costoConocido)}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </ReportFiltersPanel>
  );
}
