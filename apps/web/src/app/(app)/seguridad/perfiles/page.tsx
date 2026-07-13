'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/data-display/empty-state';
import { ListToolbar } from '@/components/data-display/list-toolbar';
import { PaginationBar } from '@/components/data-display/pagination-bar';
import { RecordListItem } from '@/components/data-display/record-list-item';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { useToast } from '@/components/feedback/toast';
import { Field, getInputClassName, inputClassName } from '@/components/forms/field';
import { FormShell } from '@/components/forms/form-shell';
import { ReactivateField } from '@/components/forms/reactivate-field';
import { Button } from '@/components/ui/button';
import { usePaginatedList } from '@/modules/configuracion/hooks/use-paginated-list';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { getRequiredFieldError, type FieldErrors } from '@/lib/form-validation';
import { useScrollToFormOnEdit } from '@/lib/use-scroll-to-form-on-edit';
import { PERMISOS } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';

type Perfil = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  estadoRegistro: 'ACTIVO' | 'INACTIVO';
  permisoIds: string[];
};

type Permiso = {
  id: string;
  codigo: string;
  nombre: string;
  modulo: string;
};

type FormMode = { type: 'create' } | { type: 'edit'; item: Perfil };

export default function PerfilesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [permisoIds, setPermisoIds] = useState<string[]>([]);
  const [reactivar, setReactivar] = useState(false);
  const [pendingInactivate, setPendingInactivate] = useState<Perfil | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const {
    items: perfiles,
    meta,
    page,
    setPage,
    search,
    setSearch,
    filtro,
    setFiltro,
    isLoading,
    isError,
  } = usePaginatedList<Perfil>({
    queryKey: ['perfiles'],
    apiPath: '/perfiles',
  });

  const permisosQuery = useQuery({
    queryKey: ['permisos-catalog'],
    queryFn: () => apiFetch<Permiso[]>('/permisos'),
  });

  const permisosPorModulo = useMemo(() => {
    const groups = new Map<string, Permiso[]>();
    for (const permiso of permisosQuery.data ?? []) {
      const list = groups.get(permiso.modulo) ?? [];
      list.push(permiso);
      groups.set(permiso.modulo, list);
    }
    return [...groups.entries()];
  }, [permisosQuery.data]);

  const isEditing = formMode?.type === 'edit';
  const editingItem = formMode?.type === 'edit' ? formMode.item : null;
  const formSectionRef = useScrollToFormOnEdit(formMode);

  function resetForm() {
    setFormMode(null);
    setNombre('');
    setDescripcion('');
    setPermisoIds([]);
    setReactivar(false);
    setFieldErrors({});
  }

  function loadForm(item: Perfil) {
    setNombre(item.nombre);
    setDescripcion(item.descripcion ?? '');
    setPermisoIds(item.permisoIds);
    setReactivar(false);
    setFieldErrors({});
  }

  const crear = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<Perfil>('/perfiles', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      resetForm();
      toast.success('Perfil registrado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['perfiles'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo registrar el perfil.')),
  });

  const actualizar = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch<Perfil>(`/perfiles/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      resetForm();
      toast.success('Cambios guardados correctamente.');
      queryClient.invalidateQueries({ queryKey: ['perfiles'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudieron guardar los cambios.')),
  });

  const inactivar = useMutation({
    mutationFn: (id: string) =>
      apiFetch<Perfil>(`/perfiles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estadoRegistro: 'INACTIVO' }),
      }),
    onSuccess: () => {
      setPendingInactivate(null);
      toast.success('Perfil inactivado.');
      queryClient.invalidateQueries({ queryKey: ['perfiles'] });
    },
    onError: (error) => {
      setPendingInactivate(null);
      toast.error(getApiErrorMessage(error, 'No se pudo inactivar el perfil.'));
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: FieldErrors = {};
    const nombreError = getRequiredFieldError(nombre);
    if (nombreError) errors.nombre = nombreError;
    if (permisoIds.length === 0) errors.permisoIds = 'Selecciona al menos un permiso.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const payload: Record<string, unknown> = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      permisoIds,
    };

    if (isEditing && editingItem) {
      if (editingItem.estadoRegistro === 'INACTIVO' && reactivar) {
        payload.estadoRegistro = 'ACTIVO';
      }
      actualizar.mutate({ id: editingItem.id, payload });
      return;
    }

    crear.mutate(payload);
  }

  return (
    <PermissionGuard permission={PERMISOS.PERFILES_ADMINISTRAR}>
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/seguridad"
        backLabel="Seguridad"
        title="Perfiles"
        description="Roles globales y permisos asignados."
      />

      <div className="rounded-2xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Resultados</p>
        <p className="mt-1 text-2xl font-bold text-primary">{meta.total}</p>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre..."
        filtro={filtro}
        onFiltroChange={setFiltro}
      />

      <div ref={formSectionRef} className="scroll-mt-20">
        {!formMode ? (
          <Button type="button" fullWidth onClick={() => setFormMode({ type: 'create' })}>
            Agregar perfil
          </Button>
        ) : (
          <FormShell
            onSubmit={onSubmit}
            title={isEditing ? `Editar: ${editingItem?.nombre}` : 'Nuevo perfil'}
            onCancel={resetForm}
            submitLabel={isEditing ? 'Guardar cambios' : 'Registrar perfil'}
          >
            <Field label="Nombre" htmlFor="nombre" required error={fieldErrors.nombre}>
              <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className={getInputClassName(Boolean(fieldErrors.nombre))} />
            </Field>
            <Field label="Descripcion" htmlFor="descripcion">
              <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={inputClassName} rows={2} />
            </Field>
            <Field label="Permisos" htmlFor="permisos" required error={fieldErrors.permisoIds}>
              <div className="max-h-64 space-y-4 overflow-y-auto rounded-xl bg-background p-3 ring-1 ring-primary/10">
                {permisosPorModulo.map(([modulo, permisos]) => (
                  <div key={modulo}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{modulo}</p>
                    <div className="mt-2 space-y-2">
                      {permisos.map((permiso) => (
                        <label key={permiso.id} className="flex items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={permisoIds.includes(permiso.id)}
                            onChange={(e) =>
                              setPermisoIds((prev) =>
                                e.target.checked
                                  ? [...prev, permiso.id]
                                  : prev.filter((id) => id !== permiso.id),
                              )
                            }
                          />
                          <span>
                            <span className="font-medium">{permiso.nombre}</span>
                            <span className="block text-xs text-muted">{permiso.codigo}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Field>
            {isEditing && editingItem?.estadoRegistro === 'INACTIVO' ? (
              <ReactivateField checked={reactivar} onChange={setReactivar} />
            ) : null}
          </FormShell>
        )}
      </div>

      {isLoading ? <p className="text-sm text-muted">Cargando perfiles...</p> : null}
      {isError ? <p className="text-sm text-danger">No se pudieron cargar los perfiles.</p> : null}
      {!isLoading && perfiles.length === 0 ? <EmptyState title="Sin perfiles" description="Agrega el primer perfil del sistema." /> : null}

      <div className="space-y-3">
        {perfiles.map((perfil) => (
          <RecordListItem
            key={perfil.id}
            title={perfil.nombre}
            estado={perfil.estadoRegistro}
            details={[
              { label: 'Permisos', value: String(perfil.permisoIds.length) },
              ...(perfil.descripcion ? [{ label: 'Descripcion', value: perfil.descripcion }] : []),
            ]}
            onEdit={() => {
              setFormMode({ type: 'edit', item: perfil });
              loadForm(perfil);
            }}
            onInactivate={
              perfil.estadoRegistro === 'ACTIVO' ? () => setPendingInactivate(perfil) : undefined
            }
          />
        ))}
      </div>

      <PaginationBar
        page={page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={meta.limit}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={Boolean(pendingInactivate)}
        title="Inactivar perfil"
        description={`El perfil "${pendingInactivate?.nombre ?? ''}" dejara de asignarse a nuevos usuarios.`}
        confirmLabel="Inactivar"
        loading={inactivar.isPending}
        onConfirm={() => pendingInactivate && inactivar.mutate(pendingInactivate.id)}
        onCancel={() => setPendingInactivate(null)}
      />
    </div>
    </PermissionGuard>
  );
}
