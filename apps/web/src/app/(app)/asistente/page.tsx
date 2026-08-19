'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Check, ChevronDown, Lightbulb, X } from 'lucide-react';
import { PERMISOS, hasPermission } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { EmptyState } from '@/components/data-display/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/components/feedback/toast';
import { Field, getInputClassName } from '@/components/forms/field';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { tenantContextFromUser } from '@/lib/tenant-context';
import {
  getApiErrorMessage,
  useDecidirRecomendacion,
  useRecomendaciones,
} from '@/modules/asistente/hooks';
import { FuenteMensajeBadge } from '@/modules/asistente/fuente-mensaje-badge';
import { SeveridadBadge } from '@/modules/asistente/severidad-badge';
import {
  ESTADO_LABEL,
  formatEvidenciaDesvio,
  type FiltroEstadoAsistente,
  type Recomendacion,
} from '@/modules/asistente/types';

export default function AsistentePage() {
  const { user } = useAuth();
  const ctx = user ? tenantContextFromUser(user) : null;
  const canDecidir = ctx ? hasPermission(ctx, PERMISOS.ASISTENTE_RECOMENDACIONES_DECIDIR) : false;

  return (
    <PermissionGuard permission={PERMISOS.ASISTENTE_RECOMENDACIONES_VER}>
      <AsistenteContent
        granjaActivaId={user?.granjaActivaId ?? ''}
        canDecidir={canDecidir}
      />
    </PermissionGuard>
  );
}

function AsistenteContent({
  granjaActivaId,
  canDecidir,
}: {
  granjaActivaId: string;
  canDecidir: boolean;
}) {
  const toast = useToast();
  const [filtro, setFiltro] = useState<FiltroEstadoAsistente>('PENDIENTE');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [descartandoId, setDescartandoId] = useState<string | null>(null);
  const [motivoDescarte, setMotivoDescarte] = useState('');

  const { data, isLoading, isError, error, refetch } = useRecomendaciones(
    granjaActivaId,
    filtro === 'PENDIENTE' ? 'PENDIENTE' : undefined,
  );

  const decidir = useDecidirRecomendacion();

  const items = useMemo(() => {
    const list = data?.items ?? [];
    if (filtro === 'RESUELTAS') {
      return list.filter((item) => item.estado !== 'PENDIENTE' && item.estado !== 'EN_COLA');
    }
    if (filtro === 'PENDIENTE') {
      return list.filter((item) => item.estado === 'PENDIENTE' || item.estado === 'EN_COLA');
    }
    return list;
  }, [data?.items, filtro]);

  const pendientesCount = (data?.items ?? []).filter(
    (item) => item.estado === 'PENDIENTE' || item.estado === 'EN_COLA',
  ).length;

  const resumenTitulo = (() => {
    if (filtro === 'RESUELTAS') {
      return items.length === 0
        ? 'Sin recomendaciones resueltas'
        : items.length === 1
          ? 'Mostrando 1 resuelta'
          : `Mostrando ${items.length} resueltas`;
    }
    if (filtro === 'TODAS') {
      return items.length === 0
        ? 'Todavia no hay recomendaciones'
        : items.length === 1
          ? '1 recomendacion en total'
          : `${items.length} recomendaciones en total`;
    }
    if (pendientesCount === 0) return 'Sin pendientes por ahora';
    if (pendientesCount === 1) return '1 recomendacion pendiente';
    return `${pendientesCount} recomendaciones pendientes`;
  })();

  const resumenAyuda =
    filtro === 'RESUELTAS'
      ? 'Aca ves las que ya aceptaste o descartaste.'
      : filtro === 'TODAS'
        ? 'Pendientes y resueltas de la granja activa.'
        : 'Se generan al registrar consumos fuera de lo habitual.';

  async function handleAceptar(rec: Recomendacion) {
    try {
      await decidir.mutateAsync({ id: rec.id, decision: 'aceptada' });
      toast.success('Recomendacion aceptada. Queda en seguimiento.');
      setExpandedId(null);
      setDescartandoId(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos guardar la decision.'));
    }
  }

  async function handleDescartar(rec: Recomendacion) {
    try {
      await decidir.mutateAsync({
        id: rec.id,
        decision: 'descartada',
        motivo: motivoDescarte.trim() || undefined,
      });
      toast.success('Recomendacion descartada.');
      setExpandedId(null);
      setDescartandoId(null);
      setMotivoDescarte('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos descartar la recomendacion.'));
    }
  }

  if (!granjaActivaId) {
    return (
      <div className="space-y-4 pb-8">
        <PageHeader
          backHref="/mas"
          title="Asistente"
          description="Recomendaciones operativas segun el consumo de tus lotes."
        />
        <EmptyState
          title="Selecciona una granja activa"
          description="El asistente trabaja con los datos de la granja que tengas seleccionada arriba."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        backHref="/mas"
        title="Asistente"
        description="Alertas y sugerencias sobre consumo. Revisalas, aceptalas o descartalas."
      />

      <section className="rounded-3xl bg-surface/90 p-4 shadow-sm ring-1 ring-primary/10">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/35 text-primary ring-1 ring-secondary/50">
            <Lightbulb className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Granja activa
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{resumenTitulo}</p>
            <p className="mt-1 text-sm leading-5 text-muted">{resumenAyuda}</p>
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ['PENDIENTE', 'Pendientes'],
            ['TODAS', 'Todas'],
            ['RESUELTAS', 'Resueltas'],
          ] as const
        ).map(([value, label]) => {
          const active = filtro === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFiltro(value)}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ring-1 transition ${
                active
                  ? 'bg-primary text-white ring-primary shadow-sm shadow-primary/25'
                  : 'bg-surface text-muted ring-primary/15 hover:bg-primary/5'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <p className="rounded-3xl bg-surface/90 px-4 py-8 text-center text-sm text-muted ring-1 ring-primary/10">
          Cargando recomendaciones...
        </p>
      ) : null}

      {isError ? (
        <EmptyState
          title="No pudimos cargar el asistente"
          description={getApiErrorMessage(error, 'Revisa la conexion e intenta de nuevo.')}
          action={
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <EmptyState
          title={
            filtro === 'PENDIENTE'
              ? 'No hay recomendaciones pendientes'
              : filtro === 'RESUELTAS'
                ? 'Todavia no hay resueltas'
                : 'Todavia no hay recomendaciones'
          }
          description={
            filtro === 'PENDIENTE'
              ? 'Cuando un consumo se desvie del promedio, aparecera aqui.'
              : filtro === 'RESUELTAS'
                ? 'Cuando aceptes o descartes una alerta, quedara en este listado.'
                : 'Registra consumos en un lote de engorde para alimentar al asistente.'
          }
          action={
            <Link
              href="/consumo"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-md shadow-primary/25"
            >
              Ir a consumo
            </Link>
          }
        />
      ) : null}

      <ul className="grid gap-3">
        {items.map((rec) => {
          const open = expandedId === rec.id;
          const descartando = descartandoId === rec.id;
          const puedeDecidir =
            canDecidir && (rec.estado === 'PENDIENTE' || rec.estado === 'EN_COLA');
          const evidenciaLines = formatEvidenciaDesvio(rec.evidencia);

          return (
            <li
              key={rec.id}
              className="overflow-hidden rounded-3xl bg-surface/95 shadow-sm ring-1 ring-primary/10"
            >
              <button
                type="button"
                className="flex w-full min-h-14 items-start gap-3 px-4 py-4 text-left transition hover:bg-primary/[0.03]"
                onClick={() => {
                  setExpandedId(open ? null : rec.id);
                  if (open) {
                    setDescartandoId(null);
                    setMotivoDescarte('');
                  }
                }}
                aria-expanded={open}
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeveridadBadge severidad={rec.severidad} />
                    <span className="text-xs font-semibold text-muted">
                      {ESTADO_LABEL[rec.estado]}
                    </span>
                  </div>
                  <p className="text-base font-semibold leading-snug text-foreground">
                    {rec.titulo}
                  </p>
                  {!open ? (
                    <p className="line-clamp-2 text-sm leading-5 text-muted">{rec.mensaje}</p>
                  ) : null}
                </div>
                <ChevronDown
                  className={`mt-1 size-5 shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>

              {open ? (
                <div className="space-y-4 border-t border-primary/10 px-4 py-4">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Por que lo sugerimos
                      </p>
                      <FuenteMensajeBadge
                        fuente={rec.fuenteMensaje}
                        modelo={rec.modeloMensaje}
                      />
                    </div>
                    <p className="mt-1 text-sm leading-6 text-foreground">{rec.mensaje}</p>
                  </div>

                  {evidenciaLines.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Evidencia
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {evidenciaLines.map((line) => (
                          <li key={line} className="text-sm text-foreground">
                            · {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {rec.hipotesis?.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Posibles causas (ordenadas)
                      </p>
                      <ol className="mt-2 space-y-2">
                        {rec.hipotesis.map((h, index) => (
                          <li
                            key={h.codigo}
                            className="rounded-2xl bg-mist/80 px-3 py-2.5 ring-1 ring-primary/10"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground">
                                {index + 1}. {h.etiqueta}
                              </p>
                              <span className="inline-flex min-h-6 shrink-0 items-center rounded-full bg-primary/10 px-2 text-[11px] font-semibold text-primary ring-1 ring-primary/15">
                                Score {h.score}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-muted">{h.motivo}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}

                  <div className="rounded-2xl bg-secondary/20 px-3 py-3 ring-1 ring-secondary/40">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Accion sugerida
                    </p>
                    <p className="mt-1 text-sm font-medium leading-6 text-foreground">
                      {rec.accionSugerida}
                    </p>
                  </div>

                  {puedeDecidir && !descartando ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="primary"
                        fullWidth
                        disabled={decidir.isPending}
                        icon={<Check className="size-4" aria-hidden />}
                        onClick={() => void handleAceptar(rec)}
                      >
                        Aceptar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        fullWidth
                        disabled={decidir.isPending}
                        icon={<X className="size-4" aria-hidden />}
                        onClick={() => {
                          setDescartandoId(rec.id);
                          setMotivoDescarte('');
                        }}
                      >
                        Descartar
                      </Button>
                    </div>
                  ) : null}

                  {puedeDecidir && descartando ? (
                    <div className="space-y-3 rounded-2xl bg-warning/10 p-3 ring-1 ring-warning/25">
                      <p className="text-sm font-semibold text-foreground">
                        Descartar esta recomendacion
                      </p>
                      <Field label="Motivo (opcional)" htmlFor={`motivo-${rec.id}`}>
                        <textarea
                          id={`motivo-${rec.id}`}
                          rows={2}
                          value={motivoDescarte}
                          onChange={(e) => setMotivoDescarte(e.target.value)}
                          className={getInputClassName()}
                          placeholder="Ej. Ya se reviso el comedero"
                        />
                      </Field>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant="outline"
                          fullWidth
                          disabled={decidir.isPending}
                          onClick={() => {
                            setDescartandoId(null);
                            setMotivoDescarte('');
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          fullWidth
                          disabled={decidir.isPending}
                          onClick={() => void handleDescartar(rec)}
                        >
                          {decidir.isPending ? 'Guardando...' : 'Confirmar descarte'}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
