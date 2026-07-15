'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Layers3 } from 'lucide-react';
import { PERMISOS, hasPermission } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/data-display/empty-state';
import { ListToolbar } from '@/components/data-display/list-toolbar';
import { PaginationBar } from '@/components/data-display/pagination-bar';
import { RecordListItem } from '@/components/data-display/record-list-item';
import { StatusBadge } from '@/components/data-display/status-badge';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { useToast } from '@/components/feedback/toast';
import { Field, FormRequiredLegend, getInputClassName } from '@/components/forms/field';
import { FormActions, FormHeader, formShellClassName } from '@/components/forms/form-shell';
import { ReactivateField } from '@/components/forms/reactivate-field';
import { Button } from '@/components/ui/button';
import { usePaginatedList } from '@/modules/configuracion/hooks/use-paginated-list';
import { apiFetch, apiFetchPaginated, getApiErrorMessage } from '@/lib/api-client';
import {
  clearFieldError,
  getRequiredFieldError,
  REQUIRED_FIELD_MESSAGE,
  type FieldErrors,
} from '@/lib/form-validation';
import { useAuth } from '@/lib/auth-context';
import { tenantContextFromUser } from '@/lib/tenant-context';
import { useScrollToFormOnEdit } from '@/lib/use-scroll-to-form-on-edit';

type EstadoRegistro = 'ACTIVO' | 'INACTIVO';
type EstadoOperativo = 'ACTIVO' | 'CERRADO' | 'CANCELADO';

type TipoAnimal = { id: string; nombre: string; estadoRegistro: EstadoRegistro };
type FinalidadProductiva = { id: string; nombre: string; estadoRegistro: EstadoRegistro };
type Ubicacion = {
  id: string;
  nombre: string;
  codigo?: string | null;
  estadoRegistro: EstadoRegistro;
};

type Lote = {
  id: string;
  companiaId: string;
  granjaId: string;
  codigo: string;
  tipoAnimalId: string;
  finalidadProductivaId: string;
  fechaInicio: string;
  cantidadInicial: number;
  ubicacionId?: string | null;
  estadoOperativo: EstadoOperativo;
  estadoRegistro: EstadoRegistro;
  observaciones?: string | null;
  tipoAnimal?: TipoAnimal;
  finalidadProductiva?: FinalidadProductiva;
  ubicacion?: Ubicacion | null;
};

type FormMode = { type: 'create' } | { type: 'edit'; item: Lote };

const estadoOperativoOptions: { value: EstadoOperativo | 'TODOS'; label: string }[] = [
  { value: 'TODOS', label: 'Todos los estados' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'CERRADO', label: 'Cerrados' },
  { value: 'CANCELADO', label: 'Cancelados' },
];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function LotesPage() {
  const { user } = useAuth();
  const ctx = user ? tenantContextFromUser(user) : null;
  const canCreate = ctx ? hasPermission(ctx, PERMISOS.LOTES_CREAR) : false;
  const canEdit = ctx ? hasPermission(ctx, PERMISOS.LOTES_EDITAR) : false;

  return (
    <PermissionGuard permission={PERMISOS.LOTES_VER}>
      <LotesContent canCreate={canCreate} canEdit={canEdit} />
    </PermissionGuard>
  );
}

function LotesContent({ canCreate, canEdit }: { canCreate: boolean; canEdit: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const granjaActivaId = user?.granjaActivaId ?? '';
  const [estadoOperativo, setEstadoOperativo] = useState<EstadoOperativo | 'TODOS'>('TODOS');
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [codigo, setCodigo] = useState('');
  const [tipoAnimalId, setTipoAnimalId] = useState('');
  const [finalidadProductivaId, setFinalidadProductivaId] = useState('');
  const [fechaInicio, setFechaInicio] = useState(todayIsoDate());
  const [cantidadInicial, setCantidadInicial] = useState('');
  const [ubicacionId, setUbicacionId] = useState('');
  const [formEstadoOperativo, setFormEstadoOperativo] = useState<EstadoOperativo>('ACTIVO');
  const [observaciones, setObservaciones] = useState('');
  const [reactivar, setReactivar] = useState(false);
  const [pendingInactivate, setPendingInactivate] = useState<Lote | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const formSectionRef = useScrollToFormOnEdit(formMode);

  const { data: tiposAnimalData } = useQuery({
    queryKey: ['tipos-animal', 'select'],
    queryFn: () =>
      apiFetchPaginated<TipoAnimal>('/tipos-animal', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const { data: finalidadesData } = useQuery({
    queryKey: ['finalidades-productivas', 'select'],
    queryFn: () =>
      apiFetchPaginated<FinalidadProductiva>('/finalidades-productivas', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const { data: ubicacionesData } = useQuery({
    queryKey: ['ubicaciones', 'select', granjaActivaId],
    enabled: Boolean(granjaActivaId),
    queryFn: () =>
      apiFetchPaginated<Ubicacion>('/ubicaciones', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
        granjaId: granjaActivaId,
      }),
  });

  const tiposAnimal = tiposAnimalData?.items ?? [];
  const finalidades = finalidadesData?.items ?? [];
  const ubicaciones = ubicacionesData?.items ?? [];

  const {
    items: lotes,
    meta,
    page,
    setPage,
    search,
    setSearch,
    filtro,
    setFiltro,
    isLoading,
    isError,
  } = usePaginatedList<Lote>({
    queryKey: ['lotes', granjaActivaId, estadoOperativo],
    apiPath: '/lotes',
    extraParams: {
      ...(granjaActivaId ? { granjaId: granjaActivaId } : {}),
      ...(estadoOperativo !== 'TODOS' ? { estadoOperativo } : {}),
    },
  });

  const isEditing = formMode?.type === 'edit';
  const editingItem = formMode?.type === 'edit' ? formMode.item : null;
  const isCatalogReady = tiposAnimal.length > 0 && finalidades.length > 0;

  function resetForm() {
    setFormMode(null);
    setCodigo('');
    setTipoAnimalId('');
    setFinalidadProductivaId('');
    setFechaInicio(todayIsoDate());
    setCantidadInicial('');
    setUbicacionId('');
    setFormEstadoOperativo('ACTIVO');
    setObservaciones('');
    setReactivar(false);
    setFieldErrors({});
  }

  function loadForm(lote: Lote) {
    setCodigo(lote.codigo);
    setTipoAnimalId(lote.tipoAnimalId);
    setFinalidadProductivaId(lote.finalidadProductivaId);
    setFechaInicio(lote.fechaInicio);
    setCantidadInicial(String(lote.cantidadInicial));
    setUbicacionId(lote.ubicacionId ?? '');
    setFormEstadoOperativo(lote.estadoOperativo);
    setObservaciones(lote.observaciones ?? '');
    setReactivar(false);
    setFieldErrors({});
  }

  const crear = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<Lote>('/lotes', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      resetForm();
      toast.success('Lote registrado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['lotes'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo registrar el lote.')),
  });

  const actualizar = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch<Lote>(`/lotes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      resetForm();
      toast.success('Cambios guardados correctamente.');
      queryClient.invalidateQueries({ queryKey: ['lotes'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'No se pudieron guardar los cambios.')),
  });

  const inactivar = useMutation({
    mutationFn: (id: string) =>
      apiFetch<Lote>(`/lotes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estadoRegistro: 'INACTIVO' }),
      }),
    onSuccess: () => {
      setPendingInactivate(null);
      toast.success('Lote inactivado.');
      queryClient.invalidateQueries({ queryKey: ['lotes'] });
    },
    onError: (error) => {
      setPendingInactivate(null);
      toast.error(getApiErrorMessage(error, 'No se pudo inactivar el lote.'));
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: FieldErrors = {};
    const codigoError = getRequiredFieldError(codigo);
    if (codigoError) errors.codigo = codigoError;
    if (!tipoAnimalId) errors.tipoAnimalId = REQUIRED_FIELD_MESSAGE;
    if (!finalidadProductivaId) errors.finalidadProductivaId = REQUIRED_FIELD_MESSAGE;
    if (!fechaInicio) errors.fechaInicio = REQUIRED_FIELD_MESSAGE;

    const cantidad = Number(cantidadInicial);
    if (!cantidadInicial || Number.isNaN(cantidad) || cantidad <= 0) {
      errors.cantidadInicial = 'Debe ser mayor que cero.';
    }

    if (!granjaActivaId) {
      errors.granjaId = 'Selecciona una granja activa para registrar lotes.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const payload: Record<string, unknown> = {
      codigo: codigo.trim(),
      tipoAnimalId,
      finalidadProductivaId,
      fechaInicio,
      cantidadInicial: cantidad,
      ubicacionId: ubicacionId || undefined,
      estadoOperativo: formEstadoOperativo,
      observaciones: observaciones.trim() || undefined,
    };

    if (isEditing && editingItem) {
      if (editingItem.estadoRegistro === 'INACTIVO' && reactivar) {
        payload.estadoRegistro = 'ACTIVO';
      }
      actualizar.mutate({ id: editingItem.id, payload });
      return;
    }

    payload.granjaId = granjaActivaId;
    crear.mutate(payload);
  }

  const isSaving = crear.isPending || actualizar.isPending;

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/dashboard"
        backLabel="Inicio"
        title="Lotes"
        description="Gestiona grupos productivos por granja: cantidad inicial, ubicacion y estado operativo."
      />

      <Link
        href="/movimientos-ubicacion"
        className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-secondary/35 px-4 text-sm font-semibold text-primary-dark ring-1 ring-secondary/40"
      >
        Movimientos de ubicacion
      </Link>

      <section className="rounded-3xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Layers3 className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Granja activa</p>
            <p className="mt-1 text-sm text-muted">
              Los lotes se registran sobre la granja seleccionada en el encabezado.
            </p>
            {!granjaActivaId ? (
              <p className="mt-2 text-sm font-medium text-warning">
                Selecciona una granja para continuar.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {!granjaActivaId ? (
        <EmptyState
          title="Selecciona una granja activa"
          description="Necesitas una granja activa para consultar o registrar lotes."
        />
      ) : !isCatalogReady ? (
        <EmptyState
          title="Faltan catalogos para crear lotes"
          description="Crea al menos un tipo de animal y una finalidad productiva activa antes de registrar lotes."
        />
      ) : (
        <>
          {canCreate || canEdit ? (
            <div ref={formSectionRef} className="scroll-mt-20">
              {!formMode ? (
                canCreate ? (
                  <Button
                    type="button"
                    fullWidth
                    onClick={() => {
                      resetForm();
                      setFormMode({ type: 'create' });
                      setTipoAnimalId(tiposAnimal[0]?.id ?? '');
                      setFinalidadProductivaId(finalidades[0]?.id ?? '');
                    }}
                  >
                    Crear lote
                  </Button>
                ) : null
              ) : (
                <form onSubmit={onSubmit} className={formShellClassName}>
                  <FormHeader
                    title={isEditing ? `Editar: ${editingItem?.codigo}` : 'Nuevo lote'}
                    description="El codigo es manual en esta version del MVP."
                  >
                    <StatusBadge estado={formEstadoOperativo} />
                  </FormHeader>
                  <FormRequiredLegend />

                  <Field label="Codigo" htmlFor="lote-codigo" required error={fieldErrors.codigo}>
                    <input
                      id="lote-codigo"
                      className={getInputClassName(Boolean(fieldErrors.codigo))}
                      placeholder="LOT-001"
                      value={codigo}
                      onChange={(e) => {
                        setCodigo(e.target.value);
                        clearFieldError('codigo', setFieldErrors);
                      }}
                    />
                  </Field>

                  <Field
                    label="Tipo de animal"
                    htmlFor="lote-tipo-animal"
                    required
                    error={fieldErrors.tipoAnimalId}
                  >
                    <select
                      id="lote-tipo-animal"
                      className={getInputClassName(Boolean(fieldErrors.tipoAnimalId))}
                      value={tipoAnimalId}
                      onChange={(e) => {
                        setTipoAnimalId(e.target.value);
                        clearFieldError('tipoAnimalId', setFieldErrors);
                      }}
                    >
                      {tiposAnimal.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Finalidad productiva"
                    htmlFor="lote-finalidad"
                    required
                    error={fieldErrors.finalidadProductivaId}
                  >
                    <select
                      id="lote-finalidad"
                      className={getInputClassName(Boolean(fieldErrors.finalidadProductivaId))}
                      value={finalidadProductivaId}
                      onChange={(e) => {
                        setFinalidadProductivaId(e.target.value);
                        clearFieldError('finalidadProductivaId', setFieldErrors);
                      }}
                    >
                      {finalidades.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Fecha de inicio"
                      htmlFor="lote-fecha"
                      required
                      error={fieldErrors.fechaInicio}
                    >
                      <input
                        id="lote-fecha"
                        type="date"
                        className={getInputClassName(Boolean(fieldErrors.fechaInicio))}
                        value={fechaInicio}
                        onChange={(e) => {
                          setFechaInicio(e.target.value);
                          clearFieldError('fechaInicio', setFieldErrors);
                        }}
                      />
                    </Field>

                    <Field
                      label="Cantidad inicial"
                      htmlFor="lote-cantidad"
                      required
                      error={fieldErrors.cantidadInicial}
                    >
                      <input
                        id="lote-cantidad"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        className={getInputClassName(Boolean(fieldErrors.cantidadInicial))}
                        value={cantidadInicial}
                        onChange={(e) => {
                          setCantidadInicial(e.target.value);
                          clearFieldError('cantidadInicial', setFieldErrors);
                        }}
                      />
                    </Field>
                  </div>

                  <Field label="Ubicacion" htmlFor="lote-ubicacion">
                    <select
                      id="lote-ubicacion"
                      className={getInputClassName()}
                      value={ubicacionId}
                      onChange={(e) => setUbicacionId(e.target.value)}
                    >
                      <option value="">Sin ubicacion asignada</option>
                      {ubicaciones.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                    {isEditing ? (
                      <p className="mt-1 text-xs text-muted">
                        Si el lote ya tiene movimientos, cambia la ubicacion desde Movimientos.
                      </p>
                    ) : null}
                  </Field>

                  <Field label="Estado operativo" htmlFor="lote-estado">
                    <select
                      id="lote-estado"
                      className={getInputClassName()}
                      value={formEstadoOperativo}
                      onChange={(e) => setFormEstadoOperativo(e.target.value as EstadoOperativo)}
                    >
                      <option value="ACTIVO">Activo</option>
                      <option value="CERRADO">Cerrado</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </Field>

                  <Field label="Observaciones" htmlFor="lote-observaciones">
                    <textarea
                      id="lote-observaciones"
                      className={`${getInputClassName()} min-h-24 py-3`}
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                    />
                  </Field>

                  {isEditing && editingItem?.estadoRegistro === 'INACTIVO' ? (
                    <ReactivateField checked={reactivar} onChange={setReactivar} />
                  ) : null}

                  <FormActions
                    onCancel={resetForm}
                    submitLabel={isEditing ? 'Guardar cambios' : 'Guardar lote'}
                    loading={isSaving}
                  />
                </form>
              )}
            </div>
          ) : null}

          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por codigo..."
            filtro={filtro}
            onFiltroChange={setFiltro}
            resultCount={meta.total}
          />

          <section className="space-y-2 rounded-3xl bg-white/55 p-3 ring-1 ring-primary/5">
            <p className="text-sm font-semibold text-foreground">Estado operativo</p>
            <div className="flex flex-wrap gap-2">
              {estadoOperativoOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEstadoOperativo(option.value)}
                  className={`min-h-9 rounded-full px-3 text-sm font-semibold transition ${
                    estadoOperativo === option.value
                      ? 'bg-primary text-white shadow-sm shadow-primary/20'
                      : 'bg-surface text-muted ring-1 ring-primary/10 hover:text-primary hover:ring-primary/20'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            {isLoading ? <p className="text-sm text-muted">Cargando lotes...</p> : null}
            {isError ? <p className="text-sm text-danger">Error al cargar lotes.</p> : null}
            {!isLoading && meta.total === 0 ? (
              <EmptyState
                title="Sin lotes para mostrar"
                description="Crea el primer lote o cambia los filtros aplicados."
              />
            ) : null}
            {lotes.map((lote) => (
              <RecordListItem
                key={lote.id}
                title={lote.codigo}
                details={[
                  { label: 'Tipo', value: lote.tipoAnimal?.nombre },
                  { label: 'Finalidad', value: lote.finalidadProductiva?.nombre },
                  { label: 'Cantidad', value: String(lote.cantidadInicial) },
                  { label: 'Inicio', value: lote.fechaInicio },
                ]}
                extra={`Ubicacion: ${lote.ubicacion?.nombre ?? 'Sin asignar'} · Estado: ${labelEstadoOperativo(lote.estadoOperativo)}`}
                estado={lote.estadoRegistro}
                onEdit={
                  canEdit
                    ? () => {
                        setFormMode({ type: 'edit', item: lote });
                        loadForm(lote);
                      }
                    : undefined
                }
                onInactivate={
                  canEdit && lote.estadoRegistro === 'ACTIVO'
                    ? () => setPendingInactivate(lote)
                    : undefined
                }
              />
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
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingInactivate)}
        title="Inactivar lote"
        description={`"${pendingInactivate?.codigo}" dejara de estar disponible para nuevas operaciones.`}
        confirmLabel="Si, inactivar"
        loading={inactivar.isPending}
        onCancel={() => setPendingInactivate(null)}
        onConfirm={() => pendingInactivate && inactivar.mutate(pendingInactivate.id)}
      />
    </div>
  );
}

function labelEstadoOperativo(estado: EstadoOperativo) {
  if (estado === 'CERRADO') return 'Cerrado';
  if (estado === 'CANCELADO') return 'Cancelado';
  return 'Activo';
}
