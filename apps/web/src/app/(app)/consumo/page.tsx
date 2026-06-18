'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useMemo, useState } from 'react';
import { PERMISOS, hasPermission } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/data-display/empty-state';
import { PaginationBar } from '@/components/data-display/pagination-bar';
import { StatusBadge } from '@/components/data-display/status-badge';
import { useToast } from '@/components/feedback/toast';
import { Field, FormRequiredLegend, getInputClassName } from '@/components/forms/field';
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

type Lote = { id: string; codigo: string; estadoOperativo: string };
type Alimento = { id: string; nombre: string; unidadMedida?: { abreviatura: string } };
type Almacen = { id: string; nombre: string };

type Existencia = {
  almacenId: string;
  alimentoId: string;
  cantidad: number;
};

type Consumo = {
  id: string;
  fecha: string;
  cantidad: string | number;
  observaciones?: string | null;
  anulado: boolean;
  lote?: Lote;
  alimento?: Alimento;
  almacen?: Almacen;
  unidadMedida?: { abreviatura: string };
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function ConsumoPage() {
  const { user } = useAuth();
  const ctx = user ? tenantContextFromUser(user) : null;
  const canCreate = ctx ? hasPermission(ctx, PERMISOS.ALIMENTACION_CONSUMO_CREAR) : false;
  const canAnular = ctx ? hasPermission(ctx, PERMISOS.ALIMENTACION_CONSUMO_ANULAR) : false;

  return (
    <PermissionGuard permission={PERMISOS.ALIMENTACION_CONSUMO_VER}>
      <ConsumoContent
        granjaActivaId={user?.granjaActivaId ?? ''}
        canCreate={canCreate}
        canAnular={canAnular}
      />
    </PermissionGuard>
  );
}

function ConsumoContent({
  granjaActivaId,
  canCreate,
  canAnular,
}: {
  granjaActivaId: string;
  canCreate: boolean;
  canAnular: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [filtroLoteId, setFiltroLoteId] = useState('');
  const [loteId, setLoteId] = useState('');
  const [alimentoId, setAlimentoId] = useState('');
  const [almacenId, setAlmacenId] = useState('');
  const [fecha, setFecha] = useState(todayIsoDate());
  const [cantidad, setCantidad] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pendingAnular, setPendingAnular] = useState<Consumo | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const { data: lotesData } = useQuery({
    queryKey: ['lotes', 'consumo-select', granjaActivaId],
    enabled: !!granjaActivaId,
    queryFn: () =>
      apiFetchPaginated<Lote>('/lotes', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
        granjaId: granjaActivaId,
        estadoOperativo: 'ACTIVO',
      }),
  });

  const { data: alimentosData } = useQuery({
    queryKey: ['alimentos', 'consumo-select'],
    queryFn: () =>
      apiFetchPaginated<Alimento>('/alimentos', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const { data: almacenesData } = useQuery({
    queryKey: ['almacenes', 'consumo-select', granjaActivaId],
    enabled: !!granjaActivaId,
    queryFn: () =>
      apiFetchPaginated<Almacen>('/almacenes', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
        granjaId: granjaActivaId,
      }),
  });

  const { data: existenciasData } = useQuery({
    queryKey: ['existencias-inventario', granjaActivaId, almacenId, alimentoId],
    enabled: !!granjaActivaId && !!almacenId && !!alimentoId,
    queryFn: () => {
      const params = new URLSearchParams({
        granjaId: granjaActivaId,
        almacenId,
        alimentoId,
      });
      return apiFetch<Existencia[]>(`/existencias-inventario?${params.toString()}`);
    },
  });

  const lotes = lotesData?.items ?? [];
  const alimentos = alimentosData?.items ?? [];
  const almacenes = almacenesData?.items ?? [];
  const stockDisponible = existenciasData?.[0]?.cantidad ?? null;

  const selectedAlimento = alimentos.find((item) => item.id === alimentoId);
  const unidadLabel = selectedAlimento?.unidadMedida?.abreviatura ?? 'unidad';

  const { items, meta, page, setPage, isLoading, isError } = usePaginatedList<Consumo>({
    queryKey: ['consumos-alimento', granjaActivaId, filtroLoteId],
    apiPath: '/consumos-alimento',
    extraParams: {
      ...(granjaActivaId ? { granjaId: granjaActivaId } : {}),
      ...(filtroLoteId ? { loteId: filtroLoteId } : {}),
      incluirAnulados: 'true',
    },
    enabled: !!granjaActivaId,
    estadoParam: 'estado',
  });

  const lotesActivos = useMemo(
    () => lotes.filter((lote) => lote.estadoOperativo === 'ACTIVO'),
    [lotes],
  );

  function resetForm() {
    setShowForm(false);
    setLoteId('');
    setAlimentoId('');
    setAlmacenId('');
    setFecha(todayIsoDate());
    setCantidad('');
    setObservaciones('');
    setFieldErrors({});
  }

  function openForm() {
    setShowForm(true);
    setLoteId(lotesActivos[0]?.id ?? '');
    setAlimentoId(alimentos[0]?.id ?? '');
    setAlmacenId(almacenes[0]?.id ?? '');
    setFecha(todayIsoDate());
    setCantidad('');
    setObservaciones('');
    setFieldErrors({});
  }

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<Consumo>('/consumos-alimento', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success('Consumo registrado.');
      void queryClient.invalidateQueries({ queryKey: ['consumos-alimento'] });
      void queryClient.invalidateQueries({ queryKey: ['existencias-inventario'] });
      void queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] });
      resetForm();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo registrar el consumo.'));
    },
  });

  const anularMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      apiFetch<Consumo>(`/consumos-alimento/${id}/anular`, {
        method: 'PATCH',
        body: JSON.stringify({ motivoAnulacion: motivo }),
      }),
    onSuccess: () => {
      toast.success('Consumo anulado.');
      void queryClient.invalidateQueries({ queryKey: ['consumos-alimento'] });
      void queryClient.invalidateQueries({ queryKey: ['existencias-inventario'] });
      void queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] });
      setPendingAnular(null);
      setMotivoAnulacion('');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo anular el consumo.'));
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: FieldErrors = {};
    if (!loteId) errors.loteId = REQUIRED_FIELD_MESSAGE;
    if (!alimentoId) errors.alimentoId = REQUIRED_FIELD_MESSAGE;
    if (!almacenId) errors.almacenId = REQUIRED_FIELD_MESSAGE;
    if (!fecha) errors.fecha = REQUIRED_FIELD_MESSAGE;
    if (!cantidad || Number(cantidad) <= 0) errors.cantidad = 'Debe ser mayor que cero.';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    createMutation.mutate({
      granjaId: granjaActivaId,
      loteId,
      alimentoId,
      almacenId,
      fecha,
      cantidad: Number(cantidad),
      observaciones: observaciones.trim() || undefined,
    });
  }

  if (!granjaActivaId) {
    return (
      <div className="space-y-5 pb-24">
        <PageHeader
          backHref="/dashboard"
          backLabel="Inicio"
          title="Consumo"
          description="Registro de alimento consumido por lote con descuento de inventario."
        />
        <EmptyState
          title="Selecciona una granja activa"
          description="Usa el selector del encabezado para registrar consumos."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/dashboard"
        backLabel="Inicio"
        title="Consumo"
        description="Registra alimento por lote y descuenta stock del almacen origen."
      />

      {canCreate ? (
        <div className="scroll-mt-20">
          {!showForm ? (
            <Button type="button" fullWidth onClick={openForm}>
              Registrar consumo
            </Button>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-black/5"
            >
              <p className="text-sm font-semibold text-muted">Nuevo consumo por lote</p>
              <FormRequiredLegend />
              <Field label="Lote" htmlFor="consumo-lote" required error={fieldErrors.loteId}>
                <select
                  id="consumo-lote"
                  className={getInputClassName(Boolean(fieldErrors.loteId))}
                  value={loteId}
                  onChange={(e) => {
                    setLoteId(e.target.value);
                    clearFieldError('loteId', setFieldErrors);
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {lotesActivos.map((lote) => (
                    <option key={lote.id} value={lote.id}>
                      {lote.codigo}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Almacen origen"
                htmlFor="consumo-almacen"
                required
                error={fieldErrors.almacenId}
              >
                <select
                  id="consumo-almacen"
                  className={getInputClassName(Boolean(fieldErrors.almacenId))}
                  value={almacenId}
                  onChange={(e) => {
                    setAlmacenId(e.target.value);
                    clearFieldError('almacenId', setFieldErrors);
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {almacenes.map((almacen) => (
                    <option key={almacen.id} value={almacen.id}>
                      {almacen.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Alimento"
                htmlFor="consumo-alimento"
                required
                error={fieldErrors.alimentoId}
              >
                <select
                  id="consumo-alimento"
                  className={getInputClassName(Boolean(fieldErrors.alimentoId))}
                  value={alimentoId}
                  onChange={(e) => {
                    setAlimentoId(e.target.value);
                    clearFieldError('alimentoId', setFieldErrors);
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {alimentos.map((alimento) => (
                    <option key={alimento.id} value={alimento.id}>
                      {alimento.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              {stockDisponible !== null ? (
                <p className="rounded-2xl bg-muted/10 px-3 py-2 text-sm text-muted">
                  Stock disponible:{' '}
                  <span className="font-semibold text-foreground">
                    {stockDisponible} {unidadLabel}
                  </span>
                </p>
              ) : null}
              <Field label="Fecha" htmlFor="consumo-fecha" required error={fieldErrors.fecha}>
                <input
                  id="consumo-fecha"
                  type="date"
                  className={getInputClassName(Boolean(fieldErrors.fecha))}
                  value={fecha}
                  onChange={(e) => {
                    setFecha(e.target.value);
                    clearFieldError('fecha', setFieldErrors);
                  }}
                />
              </Field>
              <Field
                label={`Cantidad (${unidadLabel})`}
                htmlFor="consumo-cantidad"
                required
                error={fieldErrors.cantidad}
              >
                <input
                  id="consumo-cantidad"
                  type="number"
                  min="0.0001"
                  step="any"
                  className={getInputClassName(Boolean(fieldErrors.cantidad))}
                  value={cantidad}
                  onChange={(e) => {
                    setCantidad(e.target.value);
                    clearFieldError('cantidad', setFieldErrors);
                  }}
                />
              </Field>
              <Field label="Observaciones" htmlFor="consumo-observaciones">
                <textarea
                  id="consumo-observaciones"
                  className={`${getInputClassName()} min-h-16 py-3`}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={2}
                />
              </Field>
              <div className="flex gap-2">
                <Button type="button" variant="outline" fullWidth onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" fullWidth disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Guardando...' : 'Registrar consumo'}
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      <Field label="Filtrar por lote" htmlFor="consumo-filtro-lote">
        <select
          id="consumo-filtro-lote"
          className={getInputClassName()}
          value={filtroLoteId}
          onChange={(e) => setFiltroLoteId(e.target.value)}
        >
          <option value="">Todos los lotes</option>
          {lotes.map((lote) => (
            <option key={lote.id} value={lote.id}>
              {lote.codigo}
            </option>
          ))}
        </select>
      </Field>

      <section className="space-y-3">
        {isLoading ? <p className="text-sm text-muted">Cargando consumos...</p> : null}
        {isError ? <p className="text-sm text-danger">No se pudieron cargar los consumos.</p> : null}
        {!isLoading && !isError && meta.total === 0 ? (
          <EmptyState
            title="Aun no hay consumos"
            description="Registra el primer consumo para ver el historial por lote."
          />
        ) : null}
        {items.map((item) => (
          <article
            key={item.id}
            className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10 hover:ring-primary/15"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">
                  Lote {item.lote?.codigo ?? '—'}
                </h3>
                <p className="text-sm text-muted">
                  {item.fecha} · {item.alimento?.nombre} · {item.almacen?.nombre}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <p className="font-semibold text-foreground">
                    {item.cantidad} {item.unidadMedida?.abreviatura ?? ''}
                  </p>
                  <StatusBadge estado={item.anulado ? 'ANULADO' : 'ACTIVO'} />
                  {!item.anulado && canAnular ? (
                    <button
                      type="button"
                      onClick={() => setPendingAnular(item)}
                      className="inline-flex min-h-9 shrink-0 items-center rounded-full bg-danger/10 px-3 text-xs font-semibold text-danger ring-1 ring-danger/25 transition hover:bg-danger hover:text-white hover:ring-danger hover:shadow-md hover:shadow-danger/20 active:scale-[0.98]"
                    >
                      Anular
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
            {item.observaciones ? (
              <p className="text-sm text-muted">{item.observaciones}</p>
            ) : null}
          </article>
        ))}
      </section>

      <PaginationBar
        page={page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={meta.limit}
        onPageChange={setPage}
        loading={isLoading}
      />

      {pendingAnular ? (
        <section className="space-y-4 rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-warning/20">
          <h2 className="text-lg font-semibold text-foreground">Anular consumo</h2>
          <p className="text-sm text-muted">
            Lote {pendingAnular.lote?.codigo} · {pendingAnular.alimento?.nombre} ·{' '}
            {pendingAnular.fecha}
          </p>
          <Field label="Motivo de anulacion" htmlFor="consumo-motivo-anulacion" required>
            <input
              id="consumo-motivo-anulacion"
              className={getInputClassName()}
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              placeholder="Ej. Error de carga"
            />
          </Field>
          <div className="flex gap-2">
            <Button
              type="button"
              fullWidth
              disabled={anularMutation.isPending}
              onClick={() => {
                if (!motivoAnulacion.trim()) {
                  toast.error('Debes indicar el motivo de anulacion.');
                  return;
                }
                anularMutation.mutate({ id: pendingAnular.id, motivo: motivoAnulacion.trim() });
              }}
            >
              {anularMutation.isPending ? 'Anulando...' : 'Confirmar anulacion'}
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => {
                setPendingAnular(null);
                setMotivoAnulacion('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
