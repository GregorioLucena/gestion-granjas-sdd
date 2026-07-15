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
  GranjaRequiredState,
  ReportErrorState,
  ReportLoadingState,
} from '@/modules/reportes/components/report-states';
import { formatNumber } from '@/modules/reportes/format';
import { useReportFilterOptions } from '@/modules/reportes/hooks/use-report-filter-options';

type Row = {
  almacenNombre: string;
  alimentoNombre: string;
  existencia: number;
  unidadAbreviatura: string;
  costoReferencia: number | null;
};

type Summary = {
  cantidadTotal: number;
  unidad: string;
  filas: number;
};

export default function ExistenciasReportPage() {
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
    queryKey: ['reportes', 'alimentacion', 'existencias', granjaId, filters],
    enabled: !!granjaId,
    queryFn: () =>
      apiFetchReport<Row[], Summary>('/reportes/alimentacion/existencias', {
        granjaId,
        alimentoId: filters.alimentoId || undefined,
        almacenId: filters.almacenId || undefined,
        loteId: filters.loteId || undefined,
      }),
  });

  if (!granjaId) return <GranjaRequiredState />;

  const summary = reportQuery.data?.summary;
  const rows = reportQuery.data?.data ?? [];
  const consultado = reportQuery.data?.meta.fechaConsulta;

  return (
    <ReportFiltersPanel
      title="Existencias"
      description="Stock actual por almacen y alimento en unidad base."
      showPeriodo={false}
      applied={filters}
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
              {
                label: 'Total (unidad compatible)',
                value: `${formatNumber(summary.cantidadTotal, 4)} ${summary.unidad}`,
              },
              {
                label: 'Lineas',
                value: String(summary.filas),
                hint: consultado
                  ? `Consulta: ${new Date(consultado).toLocaleString('es-PY')}`
                  : undefined,
              },
            ]}
          />
          {rows.length === 0 ? (
            <EmptyState
              title="Sin existencias"
              description="No hay stock con los filtros seleccionados."
            />
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => (
                <li
                  key={`${row.almacenNombre}-${row.alimentoNombre}`}
                  className="rounded-2xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10"
                >
                  <p className="font-semibold">{row.alimentoNombre}</p>
                  <p className="text-sm text-muted">{row.almacenNombre}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <p>
                      <span className="text-muted">Existencia</span>
                      <br />
                      <span className="font-semibold">
                        {formatNumber(row.existencia, 4)} {row.unidadAbreviatura}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted">Costo referencia</span>
                      <br />
                      <span className="font-semibold">
                        {row.costoReferencia === null
                          ? 'No disponible'
                          : formatNumber(row.costoReferencia, 2)}
                      </span>
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    El costo de referencia no es el costo historico de consumos.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </ReportFiltersPanel>
  );
}
