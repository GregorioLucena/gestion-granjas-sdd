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
  buildOptionalStringFields,
  clearFieldError,
  getRequiredFieldError,
  type FieldErrors,
} from '@/lib/form-validation';
import { useAuth } from '@/lib/auth-context';
import { tenantContextFromUser } from '@/lib/tenant-context';
import { useScrollToFormOnEdit } from '@/lib/use-scroll-to-form-on-edit';

type Ubicacion = { id: string; nombre: string; estadoRegistro: 'ACTIVO' | 'INACTIVO' };

type Almacen = {
  id: string;
  nombre: string;
  codigo?: string | null;
  granjaId: string;
  ubicacionId?: string | null;
  observaciones?: string | null;
  estadoRegistro: 'ACTIVO' | 'INACTIVO';
  ubicacion?: Ubicacion | null;
};

type FormMode = { type: 'create' } | { type: 'edit'; item: Almacen };

export default function AlmacenesPage() {
  const { user } = useAuth();
  const ctx = user ? tenantContextFromUser(user) : null;
  const canAdmin = ctx ? hasPermission(ctx, PERMISOS.INVENTARIO_ALMACENES_ADMINISTRAR) : false;

  return (
    <PermissionGuard permission={PERMISOS.INVENTARIO_VER}>
      <AlmacenesContent canAdmin={canAdmin} granjaActivaId={user?.granjaActivaId ?? ''} />
    </PermissionGuard>
  );
}

function AlmacenesContent({
  canAdmin,
  granjaActivaId,
}: {
  canAdmin: boolean;
  granjaActivaId: string;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [ubicacionId, setUbicacionId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [reactivar, setReactivar] = useState(false);
  const [pendingInactivate, setPendingInactivate] = useState<Almacen | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const formSectionRef = useScrollToFormOnEdit(formMode);

  const { data: ubicacionesData } = useQuery({
    queryKey: ['ubicaciones', 'select', granjaActivaId],
    enabled: !!granjaActivaId,
    queryFn: () =>
      apiFetchPaginated<Ubicacion>('/ubicaciones', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
        granjaId: granjaActivaId,
      }),
  });

  const ubicaciones = ubicacionesData?.items ?? [];

  const { items, meta, page, setPage, search, setSearch, filtro, setFiltro, isLoading, isError } =
    usePaginatedList<Almacen>({
      queryKey: ['almacenes', granjaActivaId],
      apiPath: '/almacenes',
      extraParams: granjaActivaId ? { granjaId: granjaActivaId } : undefined,
      enabled: !!granjaActivaId,
    });

  const isEditing = formMode?.type === 'edit';
  const editingItem = formMode?.type === 'edit' ? formMode.item : null;

  function resetForm() {
    setFormMode(null);
    setNombre('');
    setCodigo('');
    setUbicacionId('');
    setObservaciones('');
    setReactivar(false);
    setFieldErrors({});
  }

  function openCreateForm() {
    setFormMode({ type: 'create' });
    setNombre('');
    setCodigo('');
    setUbicacionId('');
    setObservaciones('');
    setReactivar(false);
    setFieldErrors({});
  }

  function openEditForm(item: Almacen) {
    setFormMode({ type: 'edit', item });
    setNombre(item.nombre);
    setCodigo(item.codigo ?? '');
    setUbicacionId(item.ubicacionId ?? '');
    setObservaciones(item.observaciones ?? '');
    setReactivar(false);
    setFieldErrors({});
  }

  const crear = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<Almacen>('/almacenes', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success('Almacen creado.');
      void queryClient.invalidateQueries({ queryKey: ['almacenes'] });
      resetForm();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el almacen.'));
    },
  });

  const actualizar = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch<Almacen>(`/almacenes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success('Almacen actualizado.');
      void queryClient.invalidateQueries({ queryKey: ['almacenes'] });
      resetForm();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el almacen.'));
    },
  });

  const inactivar = useMutation({
    mutationFn: (id: string) =>
      apiFetch<Almacen>(`/almacenes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estadoRegistro: 'INACTIVO' }),
      }),
    onSuccess: () => {
      toast.success('Almacen inactivado.');
      void queryClient.invalidateQueries({ queryKey: ['almacenes'] });
      setPendingInactivate(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el almacen.'));
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: FieldErrors = {};
    const nombreError = getRequiredFieldError(nombre);
    if (nombreError) errors.nombre = nombreError;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const payload: Record<string, unknown> = {
      nombre: nombre.trim(),
      ...buildOptionalStringFields({ codigo, observaciones }),
      ubicacionId: ubicacionId || undefined,
    };

    if (isEditing && editingItem) {
      if (editingItem.estadoRegistro === 'INACTIVO' && reactivar) {
        payload.estadoRegistro = 'ACTIVO';
      }
      actualizar.mutate({ id: editingItem.id, payload });
      return;
    }

    crear.mutate({ ...payload, granjaId: granjaActivaId });
  }

  const isSaving = crear.isPending || actualizar.isPending;

  if (!granjaActivaId) {
    return (
      <div className="space-y-5 pb-24">
        <PageHeader
          backHref="/inventario"
          backLabel="Inventario"
          title="Almacenes"
          description="Depositos de alimento por granja."
        />
        <EmptyState
          title="Selecciona una granja activa"
          description="Usa el selector del encabezado para ver y administrar almacenes."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/inventario"
        backLabel="Inventario"
        title="Almacenes"
        description="Depositos de alimento en la granja activa."
      />

      {canAdmin ? (
        <div ref={formSectionRef} className="scroll-mt-20">
          {!formMode ? (
            <Button type="button" fullWidth onClick={openCreateForm}>
              Agregar almacen
            </Button>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-black/5"
            >
              <p className="text-sm font-semibold text-muted">
                {isEditing ? `Editar: ${editingItem?.nombre}` : 'Nuevo almacen'}
              </p>
              <FormRequiredLegend />
              <Field
                label="Nombre"
                htmlFor="almacen-nombre"
                required
                error={fieldErrors.nombre}
              >
                <input
                  id="almacen-nombre"
                  className={getInputClassName(Boolean(fieldErrors.nombre))}
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    clearFieldError('nombre', setFieldErrors);
                  }}
                  placeholder="Ej. Deposito principal"
                />
              </Field>
              <Field label="Codigo" htmlFor="almacen-codigo">
                <input
                  id="almacen-codigo"
                  className={getInputClassName()}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ej. DEP-01"
                />
              </Field>
              <Field label="Ubicacion interna" htmlFor="almacen-ubicacion">
                <select
                  id="almacen-ubicacion"
                  className={getInputClassName()}
                  value={ubicacionId}
                  onChange={(e) => setUbicacionId(e.target.value)}
                >
                  <option value="">Sin ubicacion</option>
                  {ubicaciones.map((ubicacion) => (
                    <option key={ubicacion.id} value={ubicacion.id}>
                      {ubicacion.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Observaciones" htmlFor="almacen-observaciones">
                <textarea
                  id="almacen-observaciones"
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
        {isLoading ? <p className="text-sm text-muted">Cargando almacenes...</p> : null}
        {isError ? <p className="text-sm text-danger">No se pudieron cargar los almacenes.</p> : null}
        {!isLoading && !isError && meta.total === 0 ? (
          <EmptyState
            title="Aun no hay almacenes"
            description="Usa Agregar almacen para crear un deposito en la granja activa."
          />
        ) : null}
        {items.map((item) => (
          <RecordListItem
            key={item.id}
            title={item.nombre}
            details={[
              { label: 'Codigo', value: item.codigo },
              { label: 'Ubicacion', value: item.ubicacion?.nombre },
            ]}
            estado={item.estadoRegistro}
            onEdit={canAdmin ? () => openEditForm(item) : undefined}
            onInactivate={
              canAdmin && item.estadoRegistro === 'ACTIVO'
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
        title="Inactivar almacen"
        description={`¿Inactivar ${pendingInactivate?.nombre}? No estara disponible para nuevos movimientos.`}
        confirmLabel="Inactivar"
        loading={inactivar.isPending}
        onConfirm={() => pendingInactivate && inactivar.mutate(pendingInactivate.id)}
        onCancel={() => setPendingInactivate(null)}
      />
    </div>
  );
}
