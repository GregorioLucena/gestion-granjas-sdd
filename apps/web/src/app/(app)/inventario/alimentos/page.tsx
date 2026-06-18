'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { PERMISOS, hasPermission } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/data-display/empty-state';
import { ListToolbar } from '@/components/data-display/list-toolbar';
import { PaginationBar } from '@/components/data-display/pagination-bar';
import { RecordListItem } from '@/components/data-display/record-list-item';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { useToast } from '@/components/feedback/toast';
import { Field, FormRequiredLegend, getInputClassName } from '@/components/forms/field';
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

type Maestra = { id: string; nombre: string; estadoRegistro: 'ACTIVO' | 'INACTIVO' };
type UnidadMedida = { id: string; nombre: string; abreviatura: string };

type Alimento = {
  id: string;
  nombre: string;
  tipoAlimentoId: string;
  presentacionId: string;
  unidadMedidaId: string;
  factorConversion: string | number;
  costoReferencia?: string | number | null;
  observaciones?: string | null;
  estadoRegistro: 'ACTIVO' | 'INACTIVO';
  tipoAlimento?: Maestra;
  presentacion?: Maestra;
  unidadMedida?: UnidadMedida;
};

type FormMode = { type: 'create' } | { type: 'edit'; item: Alimento };

export default function AlimentosPage() {
  const { user } = useAuth();
  const ctx = user ? tenantContextFromUser(user) : null;
  const canCreate = ctx ? hasPermission(ctx, PERMISOS.INVENTARIO_ALIMENTOS_CREAR) : false;
  const canEdit = ctx ? hasPermission(ctx, PERMISOS.INVENTARIO_ALIMENTOS_EDITAR) : false;

  return (
    <PermissionGuard permission={PERMISOS.INVENTARIO_VER}>
      <AlimentosContent canCreate={canCreate} canEdit={canEdit} />
    </PermissionGuard>
  );
}

function AlimentosContent({ canCreate, canEdit }: { canCreate: boolean; canEdit: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [nombre, setNombre] = useState('');
  const [tipoAlimentoId, setTipoAlimentoId] = useState('');
  const [presentacionId, setPresentacionId] = useState('');
  const [unidadMedidaId, setUnidadMedidaId] = useState('');
  const [factorConversion, setFactorConversion] = useState('1');
  const [costoReferencia, setCostoReferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [reactivar, setReactivar] = useState(false);
  const [pendingInactivate, setPendingInactivate] = useState<Alimento | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const formSectionRef = useScrollToFormOnEdit(formMode);

  const { data: tiposData } = useQuery({
    queryKey: ['tipos-alimento', 'select'],
    queryFn: () =>
      apiFetchPaginated<Maestra>('/tipos-alimento', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const { data: presentacionesData } = useQuery({
    queryKey: ['presentaciones-alimento', 'select'],
    queryFn: () =>
      apiFetchPaginated<Maestra>('/presentaciones-alimento', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const { data: unidadesData } = useQuery({
    queryKey: ['unidades-medida'],
    queryFn: () => apiFetch<UnidadMedida[]>('/unidades-medida'),
  });

  const tipos = tiposData?.items ?? [];
  const presentaciones = presentacionesData?.items ?? [];
  const unidades = unidadesData ?? [];

  const { items, meta, page, setPage, search, setSearch, filtro, setFiltro, isLoading, isError } =
    usePaginatedList<Alimento>({
      queryKey: ['alimentos'],
      apiPath: '/alimentos',
    });

  const isEditing = formMode?.type === 'edit';
  const editingItem = formMode?.type === 'edit' ? formMode.item : null;
  const selectedUnidad = unidades.find((u) => u.id === unidadMedidaId);

  function resetForm() {
    setFormMode(null);
    setNombre('');
    setTipoAlimentoId('');
    setPresentacionId('');
    setUnidadMedidaId('');
    setFactorConversion('1');
    setCostoReferencia('');
    setObservaciones('');
    setReactivar(false);
    setFieldErrors({});
  }

  function openCreateForm() {
    setFormMode({ type: 'create' });
    setNombre('');
    setTipoAlimentoId(tipos[0]?.id ?? '');
    setPresentacionId(presentaciones[0]?.id ?? '');
    setUnidadMedidaId(unidades[0]?.id ?? '');
    setFactorConversion('1');
    setCostoReferencia('');
    setObservaciones('');
    setReactivar(false);
    setFieldErrors({});
  }

  function openEditForm(item: Alimento) {
    setFormMode({ type: 'edit', item });
    setNombre(item.nombre);
    setTipoAlimentoId(item.tipoAlimentoId);
    setPresentacionId(item.presentacionId);
    setUnidadMedidaId(item.unidadMedidaId);
    setFactorConversion(String(item.factorConversion));
    setCostoReferencia(item.costoReferencia != null ? String(item.costoReferencia) : '');
    setObservaciones(item.observaciones ?? '');
    setReactivar(false);
    setFieldErrors({});
  }

  const crear = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<Alimento>('/alimentos', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success('Alimento creado.');
      void queryClient.invalidateQueries({ queryKey: ['alimentos'] });
      resetForm();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el alimento.'));
    },
  });

  const actualizar = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch<Alimento>(`/alimentos/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success('Alimento actualizado.');
      void queryClient.invalidateQueries({ queryKey: ['alimentos'] });
      resetForm();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el alimento.'));
    },
  });

  const inactivar = useMutation({
    mutationFn: (id: string) =>
      apiFetch<Alimento>(`/alimentos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estadoRegistro: 'INACTIVO' }),
      }),
    onSuccess: () => {
      toast.success('Alimento inactivado.');
      void queryClient.invalidateQueries({ queryKey: ['alimentos'] });
      setPendingInactivate(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el alimento.'));
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: FieldErrors = {};
    const nombreError = getRequiredFieldError(nombre);
    if (nombreError) errors.nombre = nombreError;
    if (!tipoAlimentoId) errors.tipoAlimentoId = REQUIRED_FIELD_MESSAGE;
    if (!presentacionId) errors.presentacionId = REQUIRED_FIELD_MESSAGE;
    if (!unidadMedidaId) errors.unidadMedidaId = REQUIRED_FIELD_MESSAGE;
    if (!factorConversion || Number(factorConversion) <= 0) {
      errors.factorConversion = 'Debe ser mayor que cero.';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const payload: Record<string, unknown> = {
      nombre: nombre.trim(),
      tipoAlimentoId,
      presentacionId,
      unidadMedidaId,
      factorConversion: Number(factorConversion),
      observaciones: observaciones.trim() || undefined,
    };
    if (costoReferencia.trim()) {
      payload.costoReferencia = Number(costoReferencia);
    }

    if (isEditing && editingItem) {
      if (editingItem.estadoRegistro === 'INACTIVO' && reactivar) {
        payload.estadoRegistro = 'ACTIVO';
      }
      actualizar.mutate({ id: editingItem.id, payload });
      return;
    }

    crear.mutate(payload);
  }

  const isSaving = crear.isPending || actualizar.isPending;

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/inventario"
        backLabel="Inventario"
        title="Alimentos"
        description="Productos alimenticios disponibles para movimientos de inventario."
      />

      {canCreate || canEdit ? (
        <div ref={formSectionRef} className="scroll-mt-20">
          {!formMode ? (
            canCreate ? (
              <Button type="button" fullWidth onClick={openCreateForm}>
                Agregar alimento
              </Button>
            ) : null
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-black/5"
            >
              <p className="text-sm font-semibold text-muted">
                {isEditing ? `Editar: ${editingItem?.nombre}` : 'Nuevo alimento'}
              </p>
              <FormRequiredLegend />
              <Field
                label="Nombre"
                htmlFor="alimento-nombre"
                required
                error={fieldErrors.nombre}
              >
                <input
                  id="alimento-nombre"
                  className={getInputClassName(Boolean(fieldErrors.nombre))}
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    clearFieldError('nombre', setFieldErrors);
                  }}
                  placeholder="Ej. Alimento engorde 18%"
                />
              </Field>
              <Field
                label="Tipo de alimento"
                htmlFor="alimento-tipo"
                required
                error={fieldErrors.tipoAlimentoId}
              >
                <select
                  id="alimento-tipo"
                  className={getInputClassName(Boolean(fieldErrors.tipoAlimentoId))}
                  value={tipoAlimentoId}
                  onChange={(e) => {
                    setTipoAlimentoId(e.target.value);
                    clearFieldError('tipoAlimentoId', setFieldErrors);
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Presentacion"
                htmlFor="alimento-presentacion"
                required
                error={fieldErrors.presentacionId}
              >
                <select
                  id="alimento-presentacion"
                  className={getInputClassName(Boolean(fieldErrors.presentacionId))}
                  value={presentacionId}
                  onChange={(e) => {
                    setPresentacionId(e.target.value);
                    clearFieldError('presentacionId', setFieldErrors);
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {presentaciones.map((presentacion) => (
                    <option key={presentacion.id} value={presentacion.id}>
                      {presentacion.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Unidad base"
                htmlFor="alimento-unidad"
                required
                error={fieldErrors.unidadMedidaId}
              >
                <select
                  id="alimento-unidad"
                  className={getInputClassName(Boolean(fieldErrors.unidadMedidaId))}
                  value={unidadMedidaId}
                  onChange={(e) => {
                    setUnidadMedidaId(e.target.value);
                    clearFieldError('unidadMedidaId', setFieldErrors);
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {unidades.map((unidad) => (
                    <option key={unidad.id} value={unidad.id}>
                      {unidad.nombre} ({unidad.abreviatura})
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Factor de conversion"
                htmlFor="alimento-factor"
                required
                error={fieldErrors.factorConversion}
                hint="Ej. 40 si 1 presentacion equivale a 40 kg."
              >
                <input
                  id="alimento-factor"
                  type="number"
                  min="0.0001"
                  step="any"
                  className={getInputClassName(Boolean(fieldErrors.factorConversion))}
                  value={factorConversion}
                  onChange={(e) => {
                    setFactorConversion(e.target.value);
                    clearFieldError('factorConversion', setFieldErrors);
                  }}
                />
              </Field>
              <Field label="Costo de referencia" htmlFor="alimento-costo">
                <input
                  id="alimento-costo"
                  type="number"
                  min="0"
                  step="any"
                  className={getInputClassName()}
                  value={costoReferencia}
                  onChange={(e) => setCostoReferencia(e.target.value)}
                  placeholder={selectedUnidad ? `Por ${selectedUnidad.abreviatura}` : undefined}
                />
              </Field>
              <Field label="Observaciones" htmlFor="alimento-observaciones">
                <textarea
                  id="alimento-observaciones"
                  className={`${getInputClassName()} min-h-16 py-3`}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={2}
                />
              </Field>
              {isEditing && editingItem?.estadoRegistro === 'INACTIVO' ? (
                <ReactivateField checked={reactivar} onChange={setReactivar} />
              ) : null}
              <div className="flex gap-2">
                <Button type="button" variant="outline" fullWidth onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" fullWidth disabled={isSaving}>
                  {isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar'}
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        filtro={filtro}
        onFiltroChange={setFiltro}
        searchPlaceholder="Buscar por nombre..."
        resultCount={meta.total}
      />

      <section className="space-y-3">
        {isLoading ? <p className="text-sm text-muted">Cargando alimentos...</p> : null}
        {isError ? <p className="text-sm text-danger">No se pudieron cargar los alimentos.</p> : null}
        {!isLoading && !isError && meta.total === 0 ? (
          <EmptyState
            title="Aun no hay alimentos"
            description="Completa tipos y presentaciones, luego usa Agregar alimento."
          />
        ) : null}
        {items.map((item) => (
          <RecordListItem
            key={item.id}
            title={item.nombre}
            details={[
              { label: 'Tipo', value: item.tipoAlimento?.nombre },
              { label: 'Presentacion', value: item.presentacion?.nombre },
              { label: 'Unidad', value: item.unidadMedida?.abreviatura },
            ]}
            estado={item.estadoRegistro}
            onEdit={canEdit ? () => openEditForm(item) : undefined}
            onInactivate={
              canEdit && item.estadoRegistro === 'ACTIVO'
                ? () => setPendingInactivate(item)
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

      <ConfirmDialog
        open={Boolean(pendingInactivate)}
        title="Inactivar alimento"
        description={`¿Inactivar ${pendingInactivate?.nombre}? No estara disponible para nuevos movimientos.`}
        confirmLabel="Inactivar"
        loading={inactivar.isPending}
        onConfirm={() => pendingInactivate && inactivar.mutate(pendingInactivate.id)}
        onCancel={() => setPendingInactivate(null)}
      />
    </div>
  );
}
