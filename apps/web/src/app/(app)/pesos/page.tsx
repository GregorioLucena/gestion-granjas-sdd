'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { PERMISOS, hasPermission } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/data-display/empty-state';
import { PaginationBar } from '@/components/data-display/pagination-bar';
import { StatusBadge } from '@/components/data-display/status-badge';
import { useToast } from '@/components/feedback/toast';
import { Field, FormRequiredLegend, getInputClassName } from '@/components/forms/field';
import {
  FormActions,
  FormHeader,
  formPanelWarningClassName,
  formShellClassName,
} from '@/components/forms/form-shell';
import { Button } from '@/components/ui/button';
import { usePaginatedList } from '@/modules/configuracion/hooks/use-paginated-list';
import { apiFetch, apiFetchPaginated, getApiErrorMessage } from '@/lib/api-client';
import {
  clearFieldError,
  REQUIRED_FIELD_MESSAGE,
  type FieldErrors,
} from '@/lib/form-validation';
import { useAuth } from '@/lib/auth-context';
import { tenantContextFromUser } from '@/lib/tenant-context';

type EngordeOption = {
  id: string;
  fechaInicio: string;
  cantidadInicial: number;
  cantidadActual: number;
  estado: string;
  objetivoPesoKg?: string | null;
  lote?: { id: string; codigo: string };
};

type MetodoPesaje = { id: string; nombre: string };

type ControlPeso = {
  id: string;
  fecha: string;
  momento: 'INICIAL' | 'INTERMEDIO' | 'FINAL';
  modalidad: 'PROMEDIO_LOTE' | 'MUESTRA';
  origen: 'ENGORDE_INICIO' | 'MANUAL' | 'ENGORDE_CIERRE';
  pesoPromedioKg: string | number;
  cantidadMuestra?: number | null;
  anulado: boolean;
  diferenciaKg?: number | null;
  metodoPesaje?: MetodoPesaje;
  observaciones?: string | null;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function momentoLabel(momento: string, origen: string) {
  if (origen === 'ENGORDE_INICIO') return 'Generado al iniciar';
  if (origen === 'ENGORDE_CIERRE') return 'Generado al cerrar';
  if (momento === 'INTERMEDIO') return 'Intermedio';
  return momento;
}

function modalidadLabel(modalidad: string) {
  return modalidad === 'MUESTRA' ? 'Muestra' : 'Promedio de lote';
}

function formatDiff(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(3)} kg`;
}

export default function PesosPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5 pb-24">
          <PageHeader
            backHref="/dashboard"
            backLabel="Inicio"
            title="Controles de peso"
            description="Registre la evolucion del peso promedio por animal."
          />
          <p className="text-sm text-muted">Cargando...</p>
        </div>
      }
    >
      <PesosPageInner />
    </Suspense>
  );
}

function PesosPageInner() {
  const { user } = useAuth();
  const ctx = user ? tenantContextFromUser(user) : null;

  return (
    <PermissionGuard permission={PERMISOS.PESOS_VER}>
      <PesosContent
        granjaActivaId={user?.granjaActivaId ?? ''}
        canCrear={ctx ? hasPermission(ctx, PERMISOS.PESOS_CREAR) : false}
        canAnular={ctx ? hasPermission(ctx, PERMISOS.PESOS_ANULAR) : false}
      />
    </PermissionGuard>
  );
}

function PesosContent({
  granjaActivaId,
  canCrear,
  canAnular,
}: {
  granjaActivaId: string;
  canCrear: boolean;
  canAnular: boolean;
}) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [engordeId, setEngordeId] = useState(searchParams.get('engordeId') ?? '');
  const [showForm, setShowForm] = useState(false);
  const [incluirAnulados, setIncluirAnulados] = useState(false);
  const [pendingAnular, setPendingAnular] = useState<ControlPeso | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const [fecha, setFecha] = useState(todayIsoDate());
  const [modalidad, setModalidad] = useState<'PROMEDIO_LOTE' | 'MUESTRA'>('PROMEDIO_LOTE');
  const [metodoPesajeId, setMetodoPesajeId] = useState('');
  const [pesoPromedioKg, setPesoPromedioKg] = useState('');
  const [cantidadMuestra, setCantidadMuestra] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const fromUrl = searchParams.get('engordeId');
    if (fromUrl) setEngordeId(fromUrl);
  }, [searchParams]);

  const { data: engordesData } = useQuery({
    queryKey: ['engordes', 'pesos-select', granjaActivaId],
    enabled: !!granjaActivaId,
    queryFn: () =>
      apiFetchPaginated<EngordeOption>('/engordes', {
        page: 1,
        limit: 100,
        granjaId: granjaActivaId,
        estado: 'EN_CURSO',
      }),
  });

  const { data: resumen } = useQuery({
    queryKey: ['engorde-resumen', engordeId],
    enabled: !!engordeId,
    queryFn: () => apiFetch<EngordeOption & { ultimoPesoPromedioKg?: number | null }>(`/engordes/${engordeId}`),
  });

  const { data: metodosData } = useQuery({
    queryKey: ['metodos-pesaje', 'activos'],
    queryFn: () =>
      apiFetchPaginated<MetodoPesaje>('/metodos-pesaje', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const { items, meta, page, setPage, isLoading, isError } = usePaginatedList<ControlPeso>({
    queryKey: ['controles-peso', granjaActivaId, engordeId, String(incluirAnulados)],
    apiPath: '/controles-peso',
    extraParams: {
      ...(granjaActivaId ? { granjaId: granjaActivaId } : {}),
      ...(engordeId ? { engordeId } : {}),
      ...(incluirAnulados ? { incluirAnulados: 'true' } : {}),
    },
    enabled: !!granjaActivaId && !!engordeId,
  });

  const engordes = engordesData?.items ?? [];
  const metodos = metodosData?.items ?? [];
  const selectedEngorde = useMemo(
    () => engordes.find((item) => item.id === engordeId) ?? resumen ?? null,
    [engordeId, engordes, resumen],
  );

  function resetForm() {
    setShowForm(false);
    setFecha(todayIsoDate());
    setModalidad('PROMEDIO_LOTE');
    setMetodoPesajeId(metodos[0]?.id ?? '');
    setPesoPromedioKg('');
    setCantidadMuestra('');
    setObservaciones('');
    setFieldErrors({});
  }

  function openForm() {
    setShowForm(true);
    setFecha(todayIsoDate());
    setModalidad('PROMEDIO_LOTE');
    setMetodoPesajeId(metodos[0]?.id ?? '');
    setPesoPromedioKg('');
    setCantidadMuestra('');
    setObservaciones('');
    setFieldErrors({});
  }

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch('/controles-peso', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success('Control de peso registrado.');
      void queryClient.invalidateQueries({ queryKey: ['controles-peso'] });
      void queryClient.invalidateQueries({ queryKey: ['engorde-resumen'] });
      resetForm();
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'No se pudo registrar el control de peso.')),
  });

  const anularMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      apiFetch(`/controles-peso/${id}/anular`, {
        method: 'POST',
        body: JSON.stringify({ motivo }),
      }),
    onSuccess: () => {
      toast.success('Control anulado.');
      void queryClient.invalidateQueries({ queryKey: ['controles-peso'] });
      void queryClient.invalidateQueries({ queryKey: ['engorde-resumen'] });
      setPendingAnular(null);
      setMotivoAnulacion('');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo anular el control.')),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: FieldErrors = {};
    if (!engordeId) errors.engordeId = REQUIRED_FIELD_MESSAGE;
    if (!fecha) errors.fecha = REQUIRED_FIELD_MESSAGE;
    if (!modalidad) errors.modalidad = REQUIRED_FIELD_MESSAGE;
    if (!metodoPesajeId) errors.metodoPesajeId = REQUIRED_FIELD_MESSAGE;
    if (!pesoPromedioKg || Number(pesoPromedioKg) <= 0) {
      errors.pesoPromedioKg = 'Debe ser mayor que cero.';
    }
    if (modalidad === 'MUESTRA' && (!cantidadMuestra || Number(cantidadMuestra) <= 0)) {
      errors.cantidadMuestra = REQUIRED_FIELD_MESSAGE;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    createMutation.mutate({
      engordeId,
      fecha,
      modalidad,
      metodoPesajeId,
      pesoPromedioKg: Number(pesoPromedioKg),
      ...(modalidad === 'MUESTRA' ? { cantidadMuestra: Number(cantidadMuestra) } : {}),
      observaciones: observaciones.trim() || undefined,
    });
  }

  if (!granjaActivaId) {
    return (
      <div className="space-y-5 pb-24">
        <PageHeader
          backHref="/engorde"
          backLabel="Engorde"
          title="Controles de peso"
          description="Registre la evolucion del peso promedio por animal."
        />
        <EmptyState
          title="Seleccione una granja"
          description="Elija la granja activa para ver controles de peso."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref={engordeId ? `/engorde` : '/dashboard'}
        backLabel={engordeId ? 'Engorde' : 'Inicio'}
        title="Controles de peso"
        description="Registre controles intermedios y consulte el historial del engorde."
      />

      <section className="space-y-3 rounded-3xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10">
        <Field label="Engorde en curso" htmlFor="engordeId" required>
          <select
            id="engordeId"
            className={getInputClassName()}
            value={engordeId}
            onChange={(e) => {
              setEngordeId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Seleccione un engorde</option>
            {engordes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.lote?.codigo ?? 'Lote'} · inicio {item.fechaInicio}
              </option>
            ))}
          </select>
        </Field>

        {selectedEngorde ? (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              Lote: <span className="font-semibold">{selectedEngorde.lote?.codigo ?? '—'}</span>
            </p>
            <p>
              Cantidad actual:{' '}
              <span className="font-semibold">{selectedEngorde.cantidadActual}</span>
            </p>
            <p>
              Objetivo:{' '}
              <span className="font-semibold">{selectedEngorde.objetivoPesoKg ?? '—'} kg</span>
            </p>
            <p>
              Ultimo peso:{' '}
              <span className="font-semibold">
                {resumen && 'ultimoPesoPromedioKg' in resumen && resumen.ultimoPesoPromedioKg != null
                  ? `${resumen.ultimoPesoPromedioKg} kg`
                  : '—'}
              </span>
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {canCrear && engordeId ? (
            <Button type="button" onClick={openForm}>
              Registrar peso
            </Button>
          ) : null}
          {engordeId ? (
            <Link
              href={`/engorde`}
              className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-primary ring-1 ring-primary/15"
            >
              Ver engorde
            </Link>
          ) : null}
          <Button
            type="button"
            variant={incluirAnulados ? 'primary' : 'outline'}
            onClick={() => setIncluirAnulados((value) => !value)}
          >
            {incluirAnulados ? 'Ocultar anulados' : 'Incluir anulados'}
          </Button>
        </div>
      </section>

      {showForm ? (
        <form className={formShellClassName} onSubmit={handleSubmit}>
          <FormHeader
            title="Control intermedio"
            description="El momento y el origen los asigna el sistema."
          />
          <FormRequiredLegend />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Fecha" htmlFor="fecha" required error={fieldErrors.fecha}>
              <input
                id="fecha"
                type="date"
                className={getInputClassName(!!fieldErrors.fecha)}
                value={fecha}
                onChange={(e) => {
                  setFecha(e.target.value);
                  clearFieldError('fecha', setFieldErrors);
                }}
              />
            </Field>
            <Field
              label="Peso promedio (kg)"
              htmlFor="pesoPromedioKg"
              required
              error={fieldErrors.pesoPromedioKg}
            >
              <input
                id="pesoPromedioKg"
                type="number"
                step="0.001"
                min="0"
                className={getInputClassName(!!fieldErrors.pesoPromedioKg)}
                value={pesoPromedioKg}
                onChange={(e) => {
                  setPesoPromedioKg(e.target.value);
                  clearFieldError('pesoPromedioKg', setFieldErrors);
                }}
              />
            </Field>
            <Field label="Modalidad" htmlFor="modalidad" required error={fieldErrors.modalidad}>
              <select
                id="modalidad"
                className={getInputClassName(!!fieldErrors.modalidad)}
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value as 'PROMEDIO_LOTE' | 'MUESTRA')}
              >
                <option value="PROMEDIO_LOTE">Promedio de lote</option>
                <option value="MUESTRA">Muestra</option>
              </select>
            </Field>
            <Field
              label="Metodo de pesaje"
              htmlFor="metodoPesajeId"
              required
              error={fieldErrors.metodoPesajeId}
            >
              <select
                id="metodoPesajeId"
                className={getInputClassName(!!fieldErrors.metodoPesajeId)}
                value={metodoPesajeId}
                onChange={(e) => {
                  setMetodoPesajeId(e.target.value);
                  clearFieldError('metodoPesajeId', setFieldErrors);
                }}
              >
                <option value="">Seleccione</option>
                {metodos.map((metodo) => (
                  <option key={metodo.id} value={metodo.id}>
                    {metodo.nombre}
                  </option>
                ))}
              </select>
            </Field>
            {modalidad === 'MUESTRA' ? (
              <Field
                label="Cantidad de muestra"
                htmlFor="cantidadMuestra"
                required
                error={fieldErrors.cantidadMuestra}
              >
                <input
                  id="cantidadMuestra"
                  type="number"
                  min="1"
                  className={getInputClassName(!!fieldErrors.cantidadMuestra)}
                  value={cantidadMuestra}
                  onChange={(e) => {
                    setCantidadMuestra(e.target.value);
                    clearFieldError('cantidadMuestra', setFieldErrors);
                  }}
                />
              </Field>
            ) : null}
            <Field label="Observaciones" htmlFor="observaciones">
              <textarea
                id="observaciones"
                className={getInputClassName()}
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </Field>
          </div>
          <FormActions
            submitLabel="Registrar"
            onCancel={resetForm}
            loading={createMutation.isPending}
          />
        </form>
      ) : null}

      {!engordeId ? (
        <EmptyState
          title="Seleccione un engorde"
          description="Elija un engorde en curso para ver o registrar pesos."
        />
      ) : null}

      {engordeId && isError ? (
        <p className="text-sm text-danger">No se pudo cargar el historial de pesos.</p>
      ) : null}
      {engordeId && isLoading ? (
        <p className="text-sm text-muted">Cargando controles...</p>
      ) : null}
      {engordeId && !isLoading && items.length === 0 ? (
        <EmptyState
          title="Sin controles registrados"
          description="Registre el primer control intermedio o inicie el engorde con peso inicial."
          action={
            canCrear ? (
              <Button type="button" onClick={openForm}>
                Registrar peso
              </Button>
            ) : undefined
          }
        />
      ) : null}

      <div className="grid gap-3">
        {items.map((item) => {
          const esEstimacion =
            item.metodoPesaje?.nombre.toLowerCase().includes('estimacion') ?? false;
          return (
            <article
              key={item.id}
              className="rounded-2xl border border-primary/10 bg-surface/95 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {item.fecha} · {Number(item.pesoPromedioKg).toFixed(3)} kg
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {momentoLabel(item.momento, item.origen)} · {modalidadLabel(item.modalidad)} ·{' '}
                    {item.metodoPesaje?.nombre ?? 'Metodo'}
                    {item.modalidad === 'MUESTRA' && item.cantidadMuestra
                      ? ` · muestra ${item.cantidadMuestra}`
                      : ''}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Diferencia: {formatDiff(item.diferenciaKg)}
                    {esEstimacion ? ' · Estimacion visual' : ''}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge estado={item.anulado ? 'ANULADO' : 'ACTIVO'} />
                  {!item.anulado && item.origen === 'MANUAL' && canAnular ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setPendingAnular(item)}
                    >
                      Anular
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {engordeId ? (
        <PaginationBar
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={meta.limit}
          onPageChange={setPage}
          loading={isLoading}
        />
      ) : null}

      {pendingAnular ? (
        <section className={formPanelWarningClassName}>
          <FormHeader
            title="Anular control"
            description={`${pendingAnular.fecha} · ${Number(pendingAnular.pesoPromedioKg).toFixed(3)} kg`}
          />
          <Field label="Motivo" htmlFor="motivoAnulacion" required>
            <textarea
              id="motivoAnulacion"
              className={getInputClassName()}
              rows={3}
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Button
              type="button"
              fullWidth
              variant="outline"
              onClick={() => {
                setPendingAnular(null);
                setMotivoAnulacion('');
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              fullWidth
              disabled={anularMutation.isPending}
              onClick={() => {
                if (motivoAnulacion.trim().length < 3) {
                  toast.error('Indique un motivo de al menos 3 caracteres.');
                  return;
                }
                anularMutation.mutate({
                  id: pendingAnular.id,
                  motivo: motivoAnulacion.trim(),
                });
              }}
            >
              {anularMutation.isPending ? 'Anulando...' : 'Anular'}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
