'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/data-display/empty-state';
import { ListToolbar } from '@/components/data-display/list-toolbar';
import { PaginationBar } from '@/components/data-display/pagination-bar';
import { RecordListItem } from '@/components/data-display/record-list-item';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { useToast } from '@/components/feedback/toast';
import { Field, getInputClassName } from '@/components/forms/field';
import { FormShell } from '@/components/forms/form-shell';
import { ReactivateField } from '@/components/forms/reactivate-field';
import { Button } from '@/components/ui/button';
import { usePaginatedList } from '@/modules/configuracion/hooks/use-paginated-list';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import {
  clearFieldError,
  getRequiredFieldError,
  type FieldErrors,
} from '@/lib/form-validation';
import { useScrollToFormOnEdit } from '@/lib/use-scroll-to-form-on-edit';

export type MaestraRecord = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  estadoRegistro: 'ACTIVO' | 'INACTIVO';
};

export type MaestraFormValues = {
  nombre: string;
  descripcion: string;
  reactivar: boolean;
};

type FormMode = { type: 'create' } | { type: 'edit'; item: MaestraRecord };

type MaestraSimpleAbmProps = {
  backHref: string;
  backLabel: string;
  title: string;
  description: string;
  apiPath: string;
  queryKey: string;
  nombreLabel?: string;
  nombrePlaceholder?: string;
  emptyTitle?: string;
  showDescripcion?: boolean;
  buildCreateBody?: (values: MaestraFormValues) => Record<string, unknown>;
  buildUpdateBody?: (item: MaestraRecord, values: MaestraFormValues) => Record<string, unknown>;
};

function buildDefaultUpdateBody(
  item: MaestraRecord,
  values: MaestraFormValues,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    nombre: values.nombre.trim(),
    descripcion: values.descripcion.trim() || undefined,
  };
  if (item.estadoRegistro === 'INACTIVO' && values.reactivar) {
    body.estadoRegistro = 'ACTIVO';
  }
  return body;
}

export function MaestraSimpleAbm({
  backHref,
  backLabel,
  title,
  description,
  apiPath,
  queryKey,
  nombreLabel = 'Nombre',
  nombrePlaceholder = 'Ej. Porcino',
  emptyTitle = 'Aun no hay registros',
  showDescripcion = true,
  buildCreateBody,
  buildUpdateBody = buildDefaultUpdateBody,
}: MaestraSimpleAbmProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [reactivar, setReactivar] = useState(false);
  const [pendingInactivate, setPendingInactivate] = useState<MaestraRecord | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const {
    items,
    meta,
    page,
    setPage,
    search,
    setSearch,
    filtro,
    setFiltro,
    isLoading,
    isError,
  } = usePaginatedList<MaestraRecord>({
    queryKey: [queryKey],
    apiPath,
  });

  const isEditing = formMode?.type === 'edit';
  const editingItem = formMode?.type === 'edit' ? formMode.item : null;
  const formSectionRef = useScrollToFormOnEdit(formMode);

  function resetForm() {
    setFormMode(null);
    setNombre('');
    setDescripcion('');
    setReactivar(false);
    setFieldErrors({});
  }

  function openCreateForm() {
    setFormMode({ type: 'create' });
    setNombre('');
    setDescripcion('');
    setReactivar(false);
    setFieldErrors({});
  }

  function openEditForm(item: MaestraRecord) {
    setFormMode({ type: 'edit', item });
    setNombre(item.nombre);
    setDescripcion(item.descripcion ?? '');
    setReactivar(false);
    setFieldErrors({});
  }

  const crear = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<MaestraRecord>(apiPath, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      resetForm();
      toast.success('Registro guardado correctamente.');
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'No se pudo guardar. Revisa el nombre e intenta de nuevo.')),
  });

  const actualizar = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch<MaestraRecord>(`${apiPath}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      resetForm();
      toast.success('Cambios guardados correctamente.');
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'No se pudieron guardar los cambios.')),
  });

  const inactivar = useMutation({
    mutationFn: (id: string) =>
      apiFetch<MaestraRecord>(`${apiPath}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estadoRegistro: 'INACTIVO' }),
      }),
    onSuccess: () => {
      setPendingInactivate(null);
      toast.success('Registro inactivado. Sigue visible en el historial.');
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (error) => {
      setPendingInactivate(null);
      toast.error(getApiErrorMessage(error, 'No se pudo inactivar el registro.'));
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

    const trimmed = nombre.trim();

    const values: MaestraFormValues = {
      nombre: trimmed,
      descripcion,
      reactivar,
    };

    if (isEditing && editingItem) {
      actualizar.mutate({
        id: editingItem.id,
        payload: buildUpdateBody(editingItem, values),
      });
      return;
    }

    const body = buildCreateBody
      ? buildCreateBody(values)
      : { nombre: trimmed, descripcion: descripcion.trim() || undefined };
    crear.mutate(body);
  }

  const isSaving = crear.isPending || actualizar.isPending;

  return (
    <div className="space-y-5 pb-24">
      <PageHeader backHref={backHref} backLabel={backLabel} title={title} description={description} />

      <div className="rounded-2xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Resultados</p>
        <p className="mt-1 text-2xl font-bold text-primary">{meta.total}</p>
      </div>

      <div ref={formSectionRef} className="scroll-mt-20">
        {!formMode ? (
          <Button type="button" fullWidth onClick={openCreateForm}>
            Agregar {title.toLowerCase()}
          </Button>
        ) : (
          <FormShell
            onSubmit={onSubmit}
            title={isEditing ? `Editar: ${editingItem?.nombre}` : 'Nuevo registro'}
            onCancel={resetForm}
            submitLabel={isEditing ? 'Guardar cambios' : 'Guardar'}
            loading={isSaving}
          >
            <Field
              label={nombreLabel}
              htmlFor="nombre"
              required
              error={fieldErrors.nombre}
            >
              <input
                id="nombre"
                className={getInputClassName(Boolean(fieldErrors.nombre))}
                placeholder={nombrePlaceholder}
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  clearFieldError('nombre', setFieldErrors);
                }}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.nombre)}
                autoFocus
              />
            </Field>
            {showDescripcion ? (
              <Field label="Descripcion" htmlFor="descripcion">
                <input
                  id="descripcion"
                  className={getInputClassName()}
                  placeholder="Detalle breve"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </Field>
            ) : null}
            {isEditing && editingItem?.estadoRegistro === 'INACTIVO' ? (
              <ReactivateField checked={reactivar} onChange={setReactivar} />
            ) : null}
          </FormShell>
        )}
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        filtro={filtro}
        onFiltroChange={setFiltro}
        resultCount={meta.total}
      />

      <section className="space-y-3">
        {isLoading ? <p className="text-sm text-muted">Cargando...</p> : null}
        {isError ? <p className="text-sm text-danger">No se pudo cargar el listado.</p> : null}
        {!isLoading && meta.total === 0 && !search && filtro === 'ACTIVO' ? (
          <EmptyState
            title={emptyTitle}
            description="Usa el boton de arriba para crear el primero."
          />
        ) : null}
        {!isLoading && meta.total === 0 && (search || filtro !== 'ACTIVO') ? (
          <EmptyState title="Sin resultados" description="Prueba otro texto o cambia el filtro." />
        ) : null}
        {items.map((item) => (
          <RecordListItem
            key={item.id}
            title={item.nombre}
            details={[{ label: 'Descripcion', value: item.descripcion }]}
            estado={item.estadoRegistro}
            onEdit={() => openEditForm(item)}
            onInactivate={
              item.estadoRegistro === 'ACTIVO' ? () => setPendingInactivate(item) : undefined
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
        title="Inactivar registro"
        description={`"${pendingInactivate?.nombre}" dejara de estar disponible para nuevas operaciones. El historial se conserva.`}
        confirmLabel="Si, inactivar"
        loading={inactivar.isPending}
        onCancel={() => setPendingInactivate(null)}
        onConfirm={() => pendingInactivate && inactivar.mutate(pendingInactivate.id)}
      />
    </div>
  );
}
