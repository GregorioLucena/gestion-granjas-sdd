'use client';

import Link from 'next/link';
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
import { formatKg, formatNullable, formatNumber } from '@/modules/reportes/format';
import { useReportFilterOptions } from '@/modules/reportes/hooks/use-report-filter-options';

type Row = {
  engordeId: string;
  loteId: string;
  loteCodigo: string;
  fechaInicio: string;
  duracionDias: number;
  cantidadInicial: number;
  cantidadActual: number;
  pesoInicialPromedioKg: number | null;
  ultimoPesoPromedioKg: number | null;
  gananciaHastaUltimoControlKg: number | null;
  etiquetaGanancia: string | null;
  consumoAcumuladoKg: number;
  objetivoPesoKg: number | null;
  avanceObjetivoPct: number | null;
};

type Summary = {
  total: number;
  cantidadAnimalesActual: number;
  consumoAcumuladoKg: number;
};

export default function EngordeEnCursoReportPage() {
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
    queryKey: ['reportes', 'engorde', 'en-curso', granjaId, filters, page],
    enabled: !!granjaId,
    queryFn: () =>
      apiFetchReport<Row[], Summary>('/reportes/engorde/en-curso', {
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
      title="Engordes en curso"
      description="Procesos vigentes que se solapan con el periodo."
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
              { label: 'Procesos', value: String(summary.total) },
              { label: 'Animales actuales', value: String(summary.cantidadAnimalesActual) },
              { label: 'Consumo acumulado', value: formatKg(summary.consumoAcumuladoKg) },
            ]}
          />
          {rows.length === 0 ? (
            <EmptyState
              title="Sin engordes en curso"
              description="No hay procesos vigentes en el periodo con estos filtros."
            />
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => (
                <li
                  key={row.engordeId}
                  className="rounded-2xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{row.loteCodigo}</p>
                      <p className="text-sm text-muted">
                        Inicio {row.fechaInicio} · {row.duracionDias} dia(s)
                      </p>
                    </div>
                    <Link
                      href={`/reportes/engorde/lotes/${row.loteId}`}
                      className="text-sm font-semibold text-primary"
                    >
                      Ver resumen
                    </Link>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <p>
                      <span className="text-muted">Cantidad</span>
                      <br />
                      <span className="font-semibold">
                        {row.cantidadActual} / {row.cantidadInicial}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted">Consumo</span>
                      <br />
                      <span className="font-semibold">{formatKg(row.consumoAcumuladoKg)}</span>
                    </p>
                    <p>
                      <span className="text-muted">Peso inicial</span>
                      <br />
                      <span className="font-semibold">
                        {formatNullable(row.pesoInicialPromedioKg, (n) => `${formatNumber(n)} kg`)}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted">Ultimo control</span>
                      <br />
                      <span className="font-semibold">
                        {formatNullable(row.ultimoPesoPromedioKg, (n) => `${formatNumber(n)} kg`)}
                      </span>
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {row.etiquetaGanancia
                      ? `${row.etiquetaGanancia}: ${formatNullable(row.gananciaHastaUltimoControlKg, (n) => `${formatNumber(n)} kg`)}`
                      : 'Ganancia: No disponible'}
                    {row.avanceObjetivoPct !== null
                      ? ` · Avance objetivo: ${formatNumber(row.avanceObjetivoPct, 1)} %`
                      : ''}
                  </p>
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
