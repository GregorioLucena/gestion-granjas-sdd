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
  GranjaRequiredState,
  ReportErrorState,
  ReportLoadingState,
} from '@/modules/reportes/components/report-states';
import { formatKg, formatMoney, formatNumber } from '@/modules/reportes/format';
import { useReportFilterOptions } from '@/modules/reportes/hooks/use-report-filter-options';

type MovimientoRow = {
  id: string;
  fecha: string;
  cantidad: string | number;
  costoUnitario?: string | number | null;
  referencia?: string | null;
  anulado: boolean;
  tipoMovimiento?: { nombre: string; codigo: string };
  alimento?: { nombre: string };
  almacen?: { nombre: string };
  unidadMedida?: { abreviatura: string };
  proveedor?: { nombre: string } | null;
  createdBy?: string | null;
};

type Summary = {
  cantidadTotalKg: number;
  costoConocido: number;
  coberturaCostoPct: number | null;
  etiquetaCosto: string;
};

export default function MovimientosReportPage() {
  const { user } = useAuth();
  return (
    <PermissionGuard permission={PERMISOS.REPORTES_ALIMENTACION_VER}>
      <Content granjaId={user?.granjaActivaId ?? ''} />
    </PermissionGuard>
  );
}

function Content({ granjaId }: { granjaId: string }) {
  const [filters, setFilters] = useState(defaultReportFilters);
  const [page, setPage] = useState(1);
  const options = useReportFilterOptions(granjaId);

  const reportQuery = useQuery({
    queryKey: ['reportes', 'alimentacion', 'movimientos', granjaId, filters, page],
    enabled: !!granjaId,
    queryFn: () =>
      apiFetchReport<MovimientoRow[], Summary>('/reportes/alimentacion/movimientos', {
        granjaId,
        fechaDesde: filters.fechaDesde,
        fechaHasta: filters.fechaHasta,
        alimentoId: filters.alimentoId || undefined,
        almacenId: filters.almacenId || undefined,
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
      title="Movimientos"
      description="Detalle de entradas, salidas y ajustes del periodo (sin anulados)."
      applied={filters}
      alimentos={options.alimentos}
      almacenes={options.almacenes}
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
              {
                label: 'Cantidad (pagina)',
                value: formatKg(summary.cantidadTotalKg),
              },
              {
                label: 'Costo conocido (pagina)',
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
              {
                label: 'Total registros',
                value: String(meta?.total ?? 0),
              },
            ]}
          />
          {rows.length === 0 ? (
            <EmptyState
              title="Sin movimientos"
              description="No hay movimientos validos en el periodo."
            />
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => {
                const cantidad = Number(row.cantidad);
                const unitario =
                  row.costoUnitario === null || row.costoUnitario === undefined
                    ? null
                    : Number(row.costoUnitario);
                const total =
                  unitario === null || Number.isNaN(unitario) ? null : unitario * cantidad;

                return (
                  <li
                    key={row.id}
                    className="rounded-2xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10"
                  >
                    <div>
                      <p className="font-semibold">
                        {row.tipoMovimiento?.nombre ?? 'Movimiento'}
                      </p>
                      <p className="text-sm text-muted">{row.alimento?.nombre}</p>
                      <p className="mt-1 text-xs text-muted">
                        {row.fecha} · {row.almacen?.nombre}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <p>
                        <span className="text-muted">Cantidad</span>
                        <br />
                        <span className="font-semibold">
                          {formatNumber(cantidad, 4)}{' '}
                          {row.unidadMedida?.abreviatura ?? 'kg'}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted">Costo total</span>
                        <br />
                        <span className="font-semibold">
                          {total === null ? 'Sin costo' : formatMoney(total)}
                        </span>
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {row.proveedor?.nombre
                        ? `Proveedor: ${row.proveedor.nombre}. `
                        : ''}
                      {row.referencia ? `Ref: ${row.referencia}. ` : ''}
                      {unitario === null ? 'Sin costo unitario.' : `Unitario: ${formatMoney(unitario)}.`}
                    </p>
                  </li>
                );
              })}
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
