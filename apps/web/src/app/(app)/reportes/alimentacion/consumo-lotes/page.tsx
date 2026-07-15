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
  loteCodigo: string;
  alimentoNombre: string;
  almacenNombre: string;
  cantidadKg: number;
  costoConocido: number;
  coberturaCostoPct: number | null;
  etiquetaCosto: string;
};

type Summary = {
  cantidadTotalKg: number;
  unidad: string;
  costoConocido: number;
  cantidadConCosto: number;
  cantidadSinCosto: number;
  coberturaCostoPct: number | null;
  etiquetaCosto: string;
};

export default function ConsumoLotesReportPage() {
  const { user } = useAuth();
  const granjaId = user?.granjaActivaId ?? '';

  return (
    <PermissionGuard permission={PERMISOS.REPORTES_ALIMENTACION_VER}>
      <ConsumoLotesContent granjaId={granjaId} />
    </PermissionGuard>
  );
}

function ConsumoLotesContent({ granjaId }: { granjaId: string }) {
  const [filters, setFilters] = useState(defaultReportFilters);
  const options = useReportFilterOptions(granjaId);

  const reportQuery = useQuery({
    queryKey: ['reportes', 'alimentacion', 'consumo-lotes', granjaId, filters],
    enabled: !!granjaId && !!filters.fechaDesde && !!filters.fechaHasta,
    queryFn: () =>
      apiFetchReport<Row[], Summary>('/reportes/alimentacion/consumo-lotes', {
        granjaId,
        fechaDesde: filters.fechaDesde,
        fechaHasta: filters.fechaHasta,
        loteId: filters.loteId || undefined,
        alimentoId: filters.alimentoId || undefined,
        almacenId: filters.almacenId || undefined,
      }),
  });

  if (!granjaId) {
    return <GranjaRequiredState />;
  }

  const summary = reportQuery.data?.summary;
  const rows = reportQuery.data?.data ?? [];

  return (
    <ReportFiltersPanel
      title="Consumo por lote"
      description="Cantidades en kg y costo conocido por lote, alimento y almacen."
      applied={filters}
      lotes={options.lotes}
      alimentos={options.alimentos}
      almacenes={options.almacenes}
      onApply={setFilters}
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
                hint: `${formatKg(summary.cantidadConCosto)} con costo`,
              },
              {
                label: 'Sin costo',
                value: formatKg(summary.cantidadSinCosto),
              },
            ]}
          />
          {rows.length === 0 ? (
            <EmptyState
              title="Sin consumos en el periodo"
              description="No hay consumos validos con los filtros aplicados."
            />
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => (
                <li
                  key={`${row.loteCodigo}-${row.alimentoNombre}-${row.almacenNombre}`}
                  className="rounded-2xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{row.loteCodigo}</p>
                      <p className="text-sm text-muted">{row.alimentoNombre}</p>
                      <p className="mt-1 text-xs text-muted">Almacen: {row.almacenNombre}</p>
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
