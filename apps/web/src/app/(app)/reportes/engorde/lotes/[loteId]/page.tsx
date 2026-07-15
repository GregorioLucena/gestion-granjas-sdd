'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { PERMISOS } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { EmptyState } from '@/components/data-display/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { apiFetchReport, getApiErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { SummaryCards } from '@/modules/reportes/components/report-filters-panel';
import {
  GranjaRequiredState,
  ReportErrorState,
  ReportLoadingState,
} from '@/modules/reportes/components/report-states';
import { formatKg, formatNullable, formatNumber } from '@/modules/reportes/format';

type ResumenLote = {
  lote: {
    id: string;
    codigo: string;
    tipoAnimal: string;
    finalidad: string;
  };
  engorde: {
    id: string;
    estado: string;
    fechaInicio: string;
    cantidadInicial: number;
    objetivoPesoKg: number | null;
  } | null;
  controles: Array<{
    id: string;
    fecha: string;
    momento: string;
    pesoPromedioKg: number;
  }>;
  bajas: Array<{
    id: string;
    fecha: string;
    cantidad: number;
    motivo: string;
    cuentaComoMortalidad: boolean;
  }>;
  consumosPorAlimento: Array<{
    alimentoId: string;
    alimentoNombre: string;
    cantidadKg: number;
  }>;
  cierre: {
    fechaCierre: string;
    cantidadFinal: number | null;
    motivoCierre: string | null;
  } | null;
  indicadores: {
    cantidadActual: number;
    duracionDias: number;
    pesoInicialPromedioKg: number | null;
    pesoFinalPromedioKg: number | null;
    ultimoPesoPromedioKg: number | null;
    gananciaPromedioKg: number | null;
    gananciaHastaUltimoControlKg: number | null;
    gananciaTotalEstimadaKg: number | null;
    consumoAcumuladoKg: number;
    conversionAlimenticia: number | null;
    bajasMortalidad: number;
    otrasBajas: number;
    mortalidadPct: number | null;
  } | null;
};

export default function EngordeResumenLotePage() {
  const { user } = useAuth();
  const params = useParams<{ loteId: string }>();
  return (
    <PermissionGuard permission={PERMISOS.REPORTES_ENGORDE_VER}>
      <Content granjaId={user?.granjaActivaId ?? ''} loteId={params.loteId} />
    </PermissionGuard>
  );
}

function Content({ granjaId, loteId }: { granjaId: string; loteId: string }) {
  const reportQuery = useQuery({
    queryKey: ['reportes', 'engorde', 'lote', granjaId, loteId],
    enabled: !!granjaId && !!loteId,
    queryFn: () =>
      apiFetchReport<ResumenLote>('/reportes/engorde/lotes/' + loteId, {
        granjaId,
      }),
  });

  if (!granjaId) return <GranjaRequiredState />;

  const data = reportQuery.data?.data;
  const faltantes = reportQuery.data?.meta.datosFaltantes ?? [];

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/reportes/engorde/lotes"
        backLabel="Lotes"
        title={data?.lote.codigo ? `Lote ${data.lote.codigo}` : 'Resumen por lote'}
        description="Linea de controles, bajas, consumos e indicadores."
      />

      {reportQuery.isLoading ? <ReportLoadingState /> : null}
      {reportQuery.isError ? (
        <ReportErrorState
          message={getApiErrorMessage(reportQuery.error, 'No se pudo cargar el resumen.')}
        />
      ) : null}

      {reportQuery.isSuccess && data ? (
        !data.engorde || !data.indicadores ? (
          <EmptyState
            title="Sin engorde vigente"
            description="Este lote no tiene un proceso de engorde no anulado."
          />
        ) : (
          <>
            <SummaryCards
              items={[
                {
                  label: 'Estado',
                  value: data.engorde.estado,
                  hint: `${data.lote.tipoAnimal} · ${data.lote.finalidad}`,
                },
                {
                  label: 'Cantidad actual',
                  value: String(data.indicadores.cantidadActual),
                  hint: `Inicial: ${data.engorde.cantidadInicial}`,
                },
                {
                  label: 'Duracion',
                  value: `${data.indicadores.duracionDias} dia(s)`,
                  hint: `Inicio ${data.engorde.fechaInicio}`,
                },
                {
                  label: 'Conversion',
                  value: formatNullable(data.indicadores.conversionAlimenticia),
                  hint:
                    faltantes.length > 0
                      ? `Faltan: ${faltantes.join(', ')}`
                      : 'Indicador disponible',
                },
              ]}
            />

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">Indicadores</h2>
              <div className="rounded-2xl bg-surface/95 p-4 text-sm shadow-sm ring-1 ring-primary/10">
                <p>
                  Ganancia promedio:{' '}
                  <strong>
                    {formatNullable(
                      data.indicadores.gananciaPromedioKg,
                      (n) => `${formatNumber(n)} kg`,
                    )}
                  </strong>
                </p>
                <p className="mt-1">
                  Ganancia total estimada:{' '}
                  <strong>
                    {formatNullable(
                      data.indicadores.gananciaTotalEstimadaKg,
                      (n) => `${formatNumber(n)} kg`,
                    )}
                  </strong>
                </p>
                <p className="mt-1">
                  Consumo:{' '}
                  <strong>{formatKg(data.indicadores.consumoAcumuladoKg)}</strong>
                </p>
                <p className="mt-1">
                  Mortalidad:{' '}
                  <strong>
                    {formatNullable(
                      data.indicadores.mortalidadPct,
                      (n) => `${formatNumber(n, 1)} %`,
                    )}
                  </strong>{' '}
                  ({data.indicadores.bajasMortalidad} mortalidad /{' '}
                  {data.indicadores.otrasBajas} otras)
                </p>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">Controles de peso</h2>
              {data.controles.length === 0 ? (
                <p className="text-sm text-muted">Sin controles vigentes.</p>
              ) : (
                <ul className="space-y-2">
                  {data.controles.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl bg-surface/95 px-3 py-2 text-sm ring-1 ring-primary/10"
                    >
                      {item.fecha} · {item.momento} · {formatNumber(item.pesoPromedioKg)} kg
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">Bajas</h2>
              {data.bajas.length === 0 ? (
                <p className="text-sm text-muted">Sin bajas vigentes.</p>
              ) : (
                <ul className="space-y-2">
                  {data.bajas.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl bg-surface/95 px-3 py-2 text-sm ring-1 ring-primary/10"
                    >
                      {item.fecha} · {item.cantidad} · {item.motivo}
                      {item.cuentaComoMortalidad ? ' (mortalidad)' : ''}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">Consumo por alimento</h2>
              {data.consumosPorAlimento.length === 0 ? (
                <p className="text-sm text-muted">Sin consumos en el intervalo.</p>
              ) : (
                <ul className="space-y-2">
                  {data.consumosPorAlimento.map((item) => (
                    <li
                      key={item.alimentoId}
                      className="rounded-xl bg-surface/95 px-3 py-2 text-sm ring-1 ring-primary/10"
                    >
                      {item.alimentoNombre}: {formatKg(item.cantidadKg)}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {data.cierre ? (
              <section className="rounded-2xl bg-surface/95 p-4 text-sm shadow-sm ring-1 ring-primary/10">
                <h2 className="font-semibold">Cierre</h2>
                <p className="mt-1 text-muted">
                  {data.cierre.fechaCierre} · cantidad final {data.cierre.cantidadFinal} ·{' '}
                  {data.cierre.motivoCierre ?? 'Sin motivo'}
                </p>
              </section>
            ) : null}
          </>
        )
      ) : null}
    </div>
  );
}
