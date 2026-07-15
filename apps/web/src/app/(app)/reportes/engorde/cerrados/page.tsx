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
  fechaCierre: string | null;
  duracionDias: number;
  cantidadInicial: number;
  cantidadFinal: number | null;
  pesoInicialPromedioKg: number | null;
  pesoFinalPromedioKg: number | null;
  gananciaPromedioKg: number | null;
  gananciaTotalEstimadaKg: number | null;
  consumoAcumuladoKg: number;
  mortalidadPct: number | null;
  conversionAlimenticia: number | null;
  datosFaltantes: string[];
  motivoCierre: string | null;
};

type Summary = {
  total: number;
  mortalidadAnimales: number;
  consumoAcumuladoKg: number;
  conversionDisponible: number;
};

export default function EngordeCerradosReportPage() {
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
    queryKey: ['reportes', 'engorde', 'cerrados', granjaId, filters, page],
    enabled: !!granjaId,
    queryFn: () =>
      apiFetchReport<Row[], Summary>('/reportes/engorde/cerrados', {
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
      title="Engordes cerrados"
      description="Procesos cerrados con ganancia, mortalidad y conversion cuando hay datos."
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
              { label: 'Mortandad (cabezas)', value: String(summary.mortalidadAnimales) },
              { label: 'Consumo', value: formatKg(summary.consumoAcumuladoKg) },
              {
                label: 'Con conversion',
                value: String(summary.conversionDisponible),
              },
            ]}
          />
          {rows.length === 0 ? (
            <EmptyState
              title="Sin engordes cerrados"
              description="No hay cierres vigentes en el periodo."
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
                        {row.fechaInicio} → {row.fechaCierre ?? '—'} · {row.duracionDias} dia(s)
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Motivo: {row.motivoCierre ?? 'No disponible'}
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
                        {row.cantidadFinal ?? '—'} / {row.cantidadInicial}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted">Ganancia promedio</span>
                      <br />
                      <span className="font-semibold">
                        {formatNullable(row.gananciaPromedioKg, (n) => `${formatNumber(n)} kg`)}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted">Ganancia total est.</span>
                      <br />
                      <span className="font-semibold">
                        {formatNullable(row.gananciaTotalEstimadaKg, (n) => `${formatNumber(n)} kg`)}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted">Conversion</span>
                      <br />
                      <span className="font-semibold">
                        {formatNullable(row.conversionAlimenticia)}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted">Mortalidad</span>
                      <br />
                      <span className="font-semibold">
                        {formatNullable(row.mortalidadPct, (n) => `${formatNumber(n, 1)} %`)}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted">Consumo</span>
                      <br />
                      <span className="font-semibold">{formatKg(row.consumoAcumuladoKg)}</span>
                    </p>
                  </div>
                  {row.datosFaltantes.length > 0 ? (
                    <p className="mt-2 text-xs text-muted">
                      Datos faltantes: {row.datosFaltantes.join(', ')}
                    </p>
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
