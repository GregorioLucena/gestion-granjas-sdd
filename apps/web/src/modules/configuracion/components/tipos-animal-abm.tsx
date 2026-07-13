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

type TipoAnimal = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  requiereRaza: boolean;
  duracionGestacionDias?: number | null;
  estadoRegistro: 'ACTIVO' | 'INACTIVO';
};

type FormMode = { type: 'create' } | { type: 'edit'; item: TipoAnimal };

export function TiposAnimalAbm() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [requiereRaza, setRequiereRaza] = useState(true);
  const [duracionGestacionDias, setDuracionGestacionDias] = useState('');
  const [reactivar, setReactivar] = useState(false);
  const [pendingInactivate, setPendingInactivate] = useState<TipoAnimal | null>(null);
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
  } = usePaginatedList<TipoAnimal>({
    queryKey: ['tipos-animal'],
    apiPath: '/tipos-animal',
  });

  const isEditing = formMode?.type === 'edit';
  const editingItem = formMode?.type === 'edit' ? formMode.item : null;
  const formSectionRef = useScrollToFormOnEdit(formMode);

  function resetForm() {
    setFormMode(null);
    setNombre('');
    setDescripcion('');
    setRequiereRaza(true);
    setDuracionGestacionDias('');
    setReactivar(false);
    setFieldErrors({});
  }

  function openCreateForm() {
    setFormMode({ type: 'create' });
    setNombre('');
    setDescripcion('');
    setRequiereRaza(true);
    setDuracionGestacionDias('');
    setReactivar(false);
    setFieldErrors({});
  }

  function openEditForm(item: TipoAnimal) {
    setFormMode({ type: 'edit', item });
    setNombre(item.nombre);
    setDescripcion(item.descripcion ?? '');
    setRequiereRaza(item.requiereRaza);
    setDuracionGestacionDias(
      item.duracionGestacionDias != null ? String(item.duracionGestacionDias) : '',
    );
    setReactivar(false);
    setFieldErrors({});
  }

  function buildPayload() {
    const gestacion = duracionGestacionDias.trim();
    return {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      requiereRaza,
      ...(gestacion ? { duracionGestacionDias: Number(gestacion) } : { duracionGestacionDias: undefined }),
    };
  }

  const crear = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<TipoAnimal>('/tipos-animal', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      resetForm();
      toast.success('Registro guardado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['tipos-animal'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el tipo de animal.')),
  });

  const actualizar = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch<TipoAnimal>(`/tipos-animal/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      resetForm();
      toast.success('Cambios guardados correctamente.');
      queryClient.invalidateQueries({ queryKey: ['tipos-animal'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'No se pudieron guardar los cambios.')),
  });

  const inactivar = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/tipos-animal/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estadoRegistro: 'INACTIVO' }),
      }),
    onSuccess: () => {
      setPendingInactivate(null);
      toast.success('Registro inactivado. Sigue visible en el historial.');
      queryClient.invalidateQueries({ queryKey: ['tipos-animal'] });
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

    if (isEditing && editingItem) {
      const payload = {
        ...buildPayload(),
        ...(editingItem.estadoRegistro === 'INACTIVO' && reactivar
          ? { estadoRegistro: 'ACTIVO' }
          : {}),
      };
      actualizar.mutate({ id: editingItem.id, payload });
      return;
    }

    crear.mutate(buildPayload());
  }

  const isSaving = crear.isPending || actualizar.isPending;

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/configuracion/maestras"
        backLabel="Catalogos"
        title="Tipos de animal"
        description="Especies o categorias productivas. Define si requieren raza."
      />

      <div className="rounded-2xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Resultados</p>
        <p className="mt-1 text-2xl font-bold text-primary">{meta.total}</p>
      </div>

      <div ref={formSectionRef} className="scroll-mt-20">
        {!formMode ? (
          <Button type="button" fullWidth onClick={openCreateForm}>
            Agregar tipo de animal
          </Button>
        ) : (
          <FormShell
            onSubmit={onSubmit}
            title={isEditing ? `Editar: ${editingItem?.nombre}` : 'Nuevo tipo de animal'}
            onCancel={resetForm}
            submitLabel={isEditing ? 'Guardar cambios' : 'Guardar'}
            loading={isSaving}
          >
            <Field label="Nombre" htmlFor="tipo-nombre" required error={fieldErrors.nombre}>
              <input
                id="tipo-nombre"
                className={getInputClassName(Boolean(fieldErrors.nombre))}
                placeholder="Ej. Porcino"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  clearFieldError('nombre', setFieldErrors);
                }}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.nombre)}
              />
            </Field>
            <Field label="Descripcion" htmlFor="tipo-descripcion">
              <input
                id="tipo-descripcion"
                className={getInputClassName()}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </Field>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-primary/15 bg-background/60 px-3.5 transition hover:border-primary/25">
              <input
                type="checkbox"
                checked={requiereRaza}
                onChange={(e) => setRequiereRaza(e.target.checked)}
                className="size-4 accent-primary"
              />
              <span className="text-sm font-semibold">Requiere raza</span>
            </label>
            <Field label="Duracion gestacion (dias)" htmlFor="tipo-gestacion">
              <input
                id="tipo-gestacion"
                type="number"
                min={1}
                className={getInputClassName()}
                placeholder="Ej. 114"
                value={duracionGestacionDias}
                onChange={(e) => setDuracionGestacionDias(e.target.value)}
              />
            </Field>
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
        {!isLoading && meta.total === 0 ? (
          <EmptyState title="Aun no hay tipos de animal" />
        ) : null}
        {items.map((item) => (
          <RecordListItem
            key={item.id}
            title={item.nombre}
            details={[{ label: 'Descripcion', value: item.descripcion }]}
            extra={[
              item.requiereRaza ? 'Requiere raza' : 'Raza opcional',
              item.duracionGestacionDias
                ? `Gestacion ${item.duracionGestacionDias} dias`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
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
        description={`"${pendingInactivate?.nombre}" dejara de estar disponible para nuevas operaciones.`}
        confirmLabel="Si, inactivar"
        loading={inactivar.isPending}
        onCancel={() => setPendingInactivate(null)}
        onConfirm={() => pendingInactivate && inactivar.mutate(pendingInactivate.id)}
      />
    </div>
  );
}
