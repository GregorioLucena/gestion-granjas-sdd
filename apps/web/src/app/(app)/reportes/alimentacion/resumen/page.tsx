'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PERMISOS } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
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
import { formatKg } from '@/modules/reportes/format';
import { useReportFilterOptions } from '@/modules/reportes/hooks/use-report-filter-options';

type Resumen = {
  entradas: number;
  salidasManuales: number;
  salidasConsumo: number;
  ajustesPositivos: number;
  ajustesNegativos: number;
  unidad: string;
};

export default function ResumenReportPage() {
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
    queryKey: ['reportes', 'alimentacion', 'resumen', granjaId, filters],
    enabled: !!granjaId,
    queryFn: () =>
      apiFetchReport<Resumen, Resumen>('/reportes/alimentacion/resumen', {
        granjaId,
        fechaDesde: filters.fechaDesde,
        fechaHasta: filters.fechaHasta,
        alimentoId: filters.alimentoId || undefined,
        almacenId: filters.almacenId || undefined,
      }),
  });

  if (!granjaId) return <GranjaRequiredState />;

  const resumen = reportQuery.data?.summary;

  return (
    <ReportFiltersPanel
      title="Resumen de movimientos"
      description="Totales por tipo en el periodo, en kg."
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
      {reportQuery.isSuccess && resumen ? (
        <SummaryCards
          items={[
            { label: 'Entradas', value: formatKg(resumen.entradas) },
            { label: 'Salidas manuales', value: formatKg(resumen.salidasManuales) },
            { label: 'Salidas por consumo', value: formatKg(resumen.salidasConsumo) },
            { label: 'Ajustes positivos', value: formatKg(resumen.ajustesPositivos) },
            { label: 'Ajustes negativos', value: formatKg(resumen.ajustesNegativos) },
          ]}
        />
      ) : null}
    </ReportFiltersPanel>
  );
}
