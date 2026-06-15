'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
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
import { apiFetch, apiFetchPaginated, getApiErrorMessage } from '@/lib/api-client';
import {
  clearFieldError,
  getRequiredFieldError,
  REQUIRED_FIELD_MESSAGE,
  type FieldErrors,
} from '@/lib/form-validation';
import { useScrollToFormOnEdit } from '@/lib/use-scroll-to-form-on-edit';

type TipoAnimal = { id: string; nombre: string; estadoRegistro: string };
type Raza = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  tipoAnimalId: string;
  estadoRegistro: 'ACTIVO' | 'INACTIVO';
};

type FormMode = { type: 'create' } | { type: 'edit'; item: Raza };

export function RazasAbm() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [tipoAnimalId, setTipoAnimalId] = useState('');
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [reactivar, setReactivar] = useState(false);
  const [pendingInactivate, setPendingInactivate] = useState<Raza | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const { data: tiposData } = useQuery({
    queryKey: ['tipos-animal', 'select'],
    queryFn: () =>
      apiFetchPaginated<TipoAnimal>('/tipos-animal', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const tiposAnimal = tiposData?.items ?? [];
  const selectedTipoId = tipoAnimalId || tiposAnimal[0]?.id || '';

  const {
    items: razas,
    meta,
    page,
    setPage,
    search,
    setSearch,
    filtro,
    setFiltro,
    isLoading,
  } = usePaginatedList<Raza>({
    queryKey: ['razas', selectedTipoId],
    apiPath: '/razas',
    extraParams: selectedTipoId ? { tipoAnimalId: selectedTipoId } : undefined,
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

  const crear = useMutation({
    mutationFn: (payload: { nombre: string; tipoAnimalId: string; descripcion?: string }) =>
      apiFetch<Raza>('/razas', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      resetForm();
      toast.success('Raza guardada correctamente.');
      queryClient.invalidateQueries({ queryKey: ['razas'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'No se pudo guardar la raza.')),
  });

  const actualizar = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch<Raza>(`/razas/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      resetForm();
      toast.success('Cambios guardados correctamente.');
      queryClient.invalidateQueries({ queryKey: ['razas'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'No se pudieron guardar los cambios.')),
  });

  const inactivar = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/razas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estadoRegistro: 'INACTIVO' }),
      }),
    onSuccess: () => {
      setPendingInactivate(null);
      toast.success('Raza inactivada.');
      queryClient.invalidateQueries({ queryKey: ['razas'] });
    },
    onError: (error) => {
      setPendingInactivate(null);
      toast.error(getApiErrorMessage(error, 'No se pudo inactivar la raza.'));
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: FieldErrors = {};
    const nombreError = getRequiredFieldError(nombre);
    if (nombreError) errors.nombre = nombreError;
    if (!isEditing && !selectedTipoId) {
      errors.tipoAnimalId = REQUIRED_FIELD_MESSAGE;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    if (isEditing && editingItem) {
      const payload: Record<string, unknown> = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
      };
      if (editingItem.estadoRegistro === 'INACTIVO' && reactivar) {
        payload.estadoRegistro = 'ACTIVO';
      }
      actualizar.mutate({ id: editingItem.id, payload });
      return;
    }

    if (!selectedTipoId) return;
    crear.mutate({
      nombre: nombre.trim(),
      tipoAnimalId: selectedTipoId,
      ...(descripcion.trim() ? { descripcion: descripcion.trim() } : {}),
    });
  }

  const isSaving = crear.isPending || actualizar.isPending;

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/configuracion/maestras"
        backLabel="Catalogos"
        title="Razas"
        description="Clasificacion asociada a cada tipo de animal."
      />

      <Field
        label="Tipo de animal"
        htmlFor="filtro-tipo"
        required
        error={fieldErrors.tipoAnimalId}
      >
        <select
          id="filtro-tipo"
          className={getInputClassName(Boolean(fieldErrors.tipoAnimalId))}
          value={selectedTipoId}
          onChange={(e) => {
            setTipoAnimalId(e.target.value);
            clearFieldError('tipoAnimalId', setFieldErrors);
          }}
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.tipoAnimalId)}
        >
          {tiposAnimal.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </option>
          ))}
        </select>
      </Field>

      {tiposAnimal.length === 0 ? (
        <EmptyState
          title="Primero crea un tipo de animal"
          description="Las razas dependen de un tipo activo."
        />
      ) : (
        <>
          <div ref={formSectionRef} className="scroll-mt-20">
            {!formMode ? (
              <button
                type="button"
                onClick={() => {
                  setFormMode({ type: 'create' });
                  setNombre('');
                  setDescripcion('');
                  setReactivar(false);
                  setFieldErrors({});
                }}
                className="min-h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white"
              >
                Agregar raza
              </button>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-surface p-4 ring-1 ring-black/5">
              <p className="text-sm font-semibold text-muted">
                {isEditing ? `Editar: ${editingItem?.nombre}` : 'Nueva raza'}
              </p>
              <FormRequiredLegend />
              <Field
                label="Nombre de la raza"
                htmlFor="raza-nombre"
                required
                error={fieldErrors.nombre}
              >
                <input
                  id="raza-nombre"
                  className={getInputClassName(Boolean(fieldErrors.nombre))}
                  placeholder="Ej. Yorkshire"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    clearFieldError('nombre', setFieldErrors);
                  }}
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.nombre)}
                />
              </Field>
              <Field label="Descripcion" htmlFor="raza-descripcion">
                <input
                  id="raza-descripcion"
                  className={getInputClassName()}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
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
                  {isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar'}
                </button>
              </div>
            </form>
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
            {!isLoading && meta.total === 0 ? (
              <EmptyState title="Sin razas para este tipo" />
            ) : null}
            {razas.map((raza) => (
              <RecordListItem
                key={raza.id}
                title={raza.nombre}
                details={[{ label: 'Descripcion', value: raza.descripcion }]}
                estado={raza.estadoRegistro}
                onEdit={() => {
                  setFormMode({ type: 'edit', item: raza });
                  setNombre(raza.nombre);
                  setDescripcion(raza.descripcion ?? '');
                  setReactivar(false);
                  setFieldErrors({});
                }}
                onInactivate={
                  raza.estadoRegistro === 'ACTIVO' ? () => setPendingInactivate(raza) : undefined
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
            title="Inactivar raza"
            description={`"${pendingInactivate?.nombre}" dejara de estar disponible para nuevas operaciones.`}
            confirmLabel="Si, inactivar"
            loading={inactivar.isPending}
            onCancel={() => setPendingInactivate(null)}
            onConfirm={() => pendingInactivate && inactivar.mutate(pendingInactivate.id)}
          />
        </>
      )}
    </div>
  );
}
