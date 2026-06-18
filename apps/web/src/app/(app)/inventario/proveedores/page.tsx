'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { usePaginatedList } from '@/modules/configuracion/hooks/use-paginated-list';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import {
  buildOptionalStringFields,
  clearFieldError,
  getRequiredFieldError,
  type FieldErrors,
} from '@/lib/form-validation';
import { useAuth } from '@/lib/auth-context';
import { tenantContextFromUser } from '@/lib/tenant-context';
import { useScrollToFormOnEdit } from '@/lib/use-scroll-to-form-on-edit';

type Proveedor = {
  id: string;
  nombre: string;
  identificacionFiscal?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  estadoRegistro: 'ACTIVO' | 'INACTIVO';
};

type FormMode = { type: 'create' } | { type: 'edit'; item: Proveedor };

export default function ProveedoresPage() {
  const { user } = useAuth();
  const ctx = user ? tenantContextFromUser(user) : null;
  const canAdmin = ctx ? hasPermission(ctx, PERMISOS.INVENTARIO_PROVEEDORES_ADMINISTRAR) : false;

  return (
    <PermissionGuard permission={PERMISOS.INVENTARIO_VER}>
      <ProveedoresContent canAdmin={canAdmin} />
    </PermissionGuard>
  );
}

function ProveedoresContent({ canAdmin }: { canAdmin: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [nombre, setNombre] = useState('');
  const [identificacionFiscal, setIdentificacionFiscal] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [reactivar, setReactivar] = useState(false);
  const [pendingInactivate, setPendingInactivate] = useState<Proveedor | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const formSectionRef = useScrollToFormOnEdit(formMode);

  const { items, meta, page, setPage, search, setSearch, filtro, setFiltro, isLoading, isError } =
    usePaginatedList<Proveedor>({
      queryKey: ['proveedores'],
      apiPath: '/proveedores',
    });

  const isEditing = formMode?.type === 'edit';
  const editingItem = formMode?.type === 'edit' ? formMode.item : null;

  function resetForm() {
    setFormMode(null);
    setNombre('');
    setIdentificacionFiscal('');
    setTelefono('');
    setCorreo('');
    setDireccion('');
    setReactivar(false);
    setFieldErrors({});
  }

  function openCreateForm() {
    setFormMode({ type: 'create' });
    setNombre('');
    setIdentificacionFiscal('');
    setTelefono('');
    setCorreo('');
    setDireccion('');
    setReactivar(false);
    setFieldErrors({});
  }

  function openEditForm(item: Proveedor) {
    setFormMode({ type: 'edit', item });
    setNombre(item.nombre);
    setIdentificacionFiscal(item.identificacionFiscal ?? '');
    setTelefono(item.telefono ?? '');
    setCorreo(item.correo ?? '');
    setDireccion(item.direccion ?? '');
    setReactivar(false);
    setFieldErrors({});
  }

  const crear = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<Proveedor>('/proveedores', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      resetForm();
      toast.success('Proveedor creado.');
      void queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el proveedor.')),
  });

  const actualizar = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch<Proveedor>(`/proveedores/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      resetForm();
      toast.success('Proveedor actualizado.');
      void queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el proveedor.')),
  });

  const inactivar = useMutation({
    mutationFn: (id: string) =>
      apiFetch<Proveedor>(`/proveedores/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estadoRegistro: 'INACTIVO' }),
      }),
    onSuccess: () => {
      setPendingInactivate(null);
      toast.success('Proveedor inactivado.');
      void queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
    onError: (error) => {
      setPendingInactivate(null);
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el proveedor.'));
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nombreError = getRequiredFieldError(nombre);
    if (nombreError) {
      setFieldErrors({ nombre: nombreError });
      return;
    }
    setFieldErrors({});

    const payload = {
      nombre: nombre.trim(),
      ...buildOptionalStringFields({ identificacionFiscal, telefono, correo, direccion }),
    };

    if (isEditing && editingItem) {
      const updateBody: Record<string, unknown> = { ...payload };
      if (editingItem.estadoRegistro === 'INACTIVO' && reactivar) {
        updateBody.estadoRegistro = 'ACTIVO';
      }
      actualizar.mutate({ id: editingItem.id, payload: updateBody });
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
        title="Proveedores"
        description="Contactos para asociar a entradas de inventario."
      />

      {canAdmin ? (
        <div ref={formSectionRef} className="scroll-mt-20">
          {!formMode ? (
            <button
              type="button"
              onClick={openCreateForm}
              className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white"
            >
              Agregar proveedor
            </button>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-surface p-4 ring-1 ring-black/5">
              <p className="text-sm font-semibold text-muted">
                {isEditing ? `Editar: ${editingItem?.nombre}` : 'Nuevo proveedor'}
              </p>
              <FormRequiredLegend />
              <Field label="Nombre" htmlFor="proveedor-nombre" required error={fieldErrors.nombre}>
                <input
                  id="proveedor-nombre"
                  className={getInputClassName(Boolean(fieldErrors.nombre))}
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    clearFieldError('nombre', setFieldErrors);
                  }}
                  placeholder="Ej. Agroinsumos del Norte"
                />
              </Field>
              <Field label="Identificacion fiscal" htmlFor="proveedor-fiscal">
                <input
                  id="proveedor-fiscal"
                  className={getInputClassName()}
                  value={identificacionFiscal}
                  onChange={(e) => setIdentificacionFiscal(e.target.value)}
                />
              </Field>
              <Field label="Telefono" htmlFor="proveedor-telefono">
                <input
                  id="proveedor-telefono"
                  className={getInputClassName()}
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </Field>
              <Field label="Correo" htmlFor="proveedor-correo">
                <input
                  id="proveedor-correo"
                  type="email"
                  className={getInputClassName()}
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </Field>
              <Field label="Direccion" htmlFor="proveedor-direccion">
                <input
                  id="proveedor-direccion"
                  className={getInputClassName()}
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </Field>
              {isEditing && editingItem?.estadoRegistro === 'INACTIVO' ? (
                <ReactivateField checked={reactivar} onChange={setReactivar} />
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-11 flex-1 rounded-xl border border-black/10 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="min-h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-white"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
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
        resultCount={meta.total}
      />

      {isLoading ? <p className="text-sm text-muted">Cargando proveedores...</p> : null}
      {isError ? <p className="text-sm text-danger">No se pudieron cargar los proveedores.</p> : null}
      {!isLoading && meta.total === 0 ? (
        <EmptyState
          title="Aun no hay proveedores"
          description="Crea el primero para asociarlo a entradas de compra."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <RecordListItem
              key={item.id}
              title={item.nombre}
              extra={[item.telefono, item.correo].filter(Boolean).join(' · ') || null}
              estado={item.estadoRegistro}
              onEdit={canAdmin ? () => openEditForm(item) : undefined}
              onInactivate={
                canAdmin && item.estadoRegistro === 'ACTIVO'
                  ? () => setPendingInactivate(item)
                  : undefined
              }
            />
          ))}
        </div>
      )}

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
        title="Inactivar proveedor"
        description={`¿Inactivar a ${pendingInactivate?.nombre}? No estara disponible para nuevas entradas.`}
        confirmLabel="Inactivar"
        loading={inactivar.isPending}
        onConfirm={() => pendingInactivate && inactivar.mutate(pendingInactivate.id)}
        onCancel={() => setPendingInactivate(null)}
      />
    </div>
  );
}
