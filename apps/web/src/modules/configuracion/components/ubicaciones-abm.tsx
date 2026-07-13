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
import { Field, getInputClassName } from '@/components/forms/field';
import { FormShell } from '@/components/forms/form-shell';
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
import { useScrollToFormOnEdit } from '@/lib/use-scroll-to-form-on-edit';

type Granja = { id: string; nombre: string };
type TipoUbicacion = { id: string; nombre: string; estadoRegistro: string };
type Ubicacion = {
  id: string;
  nombre: string;
  codigo?: string;
  descripcion?: string | null;
  estadoRegistro: 'ACTIVO' | 'INACTIVO';
};

type FormMode = { type: 'create' } | { type: 'edit'; item: Ubicacion };

export function UbicacionesAbm() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [granjaId, setGranjaId] = useState('');
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoUbicacionId, setTipoUbicacionId] = useState('');
  const [reactivar, setReactivar] = useState(false);
  const [pendingInactivate, setPendingInactivate] = useState<Ubicacion | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const { data: granjasData } = useQuery({
    queryKey: ['granjas', 'select'],
    queryFn: () =>
      apiFetchPaginated<Granja>('/granjas', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const { data: tiposData } = useQuery({
    queryKey: ['tipos-ubicacion', 'select'],
    queryFn: () =>
      apiFetchPaginated<TipoUbicacion>('/tipos-ubicacion', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const granjas = granjasData?.items ?? [];
  const tiposUbicacion = tiposData?.items ?? [];
  const selectedGranjaId = granjaId || granjas[0]?.id || '';
  const defaultTipoId = tiposUbicacion[0]?.id ?? '';

  const {
    items: ubicaciones,
    meta,
    page,
    setPage,
    search,
    setSearch,
    filtro,
    setFiltro,
    isLoading,
  } = usePaginatedList<Ubicacion>({
    queryKey: ['ubicaciones', selectedGranjaId],
    apiPath: '/ubicaciones',
    extraParams: selectedGranjaId ? { granjaId: selectedGranjaId } : undefined,
  });

  const isEditing = formMode?.type === 'edit';
  const editingItem = formMode?.type === 'edit' ? formMode.item : null;
  const formSectionRef = useScrollToFormOnEdit(formMode);
  const selectedTipoId = tipoUbicacionId || defaultTipoId;

  function resetForm() {
    setFormMode(null);
    setNombre('');
    setCodigo('');
    setDescripcion('');
    setTipoUbicacionId('');
    setReactivar(false);
    setFieldErrors({});
  }

  const crear = useMutation({
    mutationFn: (payload: {
      granjaId: string;
      tipoUbicacionId: string;
      nombre: string;
      codigo?: string;
      descripcion?: string;
    }) => apiFetch('/ubicaciones', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      resetForm();
      toast.success('Ubicacion guardada correctamente.');
      queryClient.invalidateQueries({ queryKey: ['ubicaciones', selectedGranjaId] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'No se pudo guardar la ubicacion.')),
  });

  const actualizar = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch(`/ubicaciones/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      resetForm();
      toast.success('Cambios guardados correctamente.');
      queryClient.invalidateQueries({ queryKey: ['ubicaciones', selectedGranjaId] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'No se pudieron guardar los cambios.')),
  });

  const inactivar = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/ubicaciones/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estadoRegistro: 'INACTIVO' }),
      }),
    onSuccess: () => {
      setPendingInactivate(null);
      toast.success('Ubicacion inactivada.');
      queryClient.invalidateQueries({ queryKey: ['ubicaciones', selectedGranjaId] });
    },
    onError: (error) => {
      setPendingInactivate(null);
      toast.error(getApiErrorMessage(error, 'No se pudo inactivar la ubicacion.'));
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: FieldErrors = {};
    const nombreError = getRequiredFieldError(nombre);
    if (nombreError) errors.nombre = nombreError;

    if (!isEditing) {
      if (!selectedGranjaId) errors.granjaId = REQUIRED_FIELD_MESSAGE;
      if (!selectedTipoId) errors.tipoUbicacionId = REQUIRED_FIELD_MESSAGE;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const codigoTrim = codigo.trim();
    const descripcionTrim = descripcion.trim();

    if (isEditing && editingItem) {
      const payload: Record<string, unknown> = {
        nombre: nombre.trim(),
        codigo: codigoTrim || undefined,
        descripcion: descripcionTrim || undefined,
      };
      if (editingItem.estadoRegistro === 'INACTIVO' && reactivar) {
        payload.estadoRegistro = 'ACTIVO';
      }
      actualizar.mutate({ id: editingItem.id, payload });
      return;
    }

    if (!selectedGranjaId || !selectedTipoId) return;
    crear.mutate({
      granjaId: selectedGranjaId,
      tipoUbicacionId: selectedTipoId,
      nombre: nombre.trim(),
      ...(codigoTrim ? { codigo: codigoTrim } : {}),
      ...(descripcionTrim ? { descripcion: descripcionTrim } : {}),
    });
  }

  const isSaving = crear.isPending || actualizar.isPending;

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/configuracion/maestras"
        backLabel="Catalogos"
        title="Ubicaciones"
        description="Lugares fisicos dentro de cada granja."
      />

      <Field
        label="Granja"
        htmlFor="granja"
        hint="Las ubicaciones pertenecen a una granja."
        required
        error={fieldErrors.granjaId}
      >
        <select
          id="granja"
          className={getInputClassName(Boolean(fieldErrors.granjaId))}
          value={selectedGranjaId}
          onChange={(e) => {
            setGranjaId(e.target.value);
            clearFieldError('granjaId', setFieldErrors);
          }}
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.granjaId)}
        >
          {granjas.map((granja) => (
            <option key={granja.id} value={granja.id}>
              {granja.nombre}
            </option>
          ))}
        </select>
      </Field>

      {tiposUbicacion.length === 0 ? (
        <EmptyState
          title="Primero crea tipos de ubicacion"
          description="Necesitas al menos un tipo activo, como Galpon o Corral."
        />
      ) : (
        <>
          <div ref={formSectionRef} className="scroll-mt-20">
            {!formMode ? (
              <Button
                type="button"
                fullWidth
                onClick={() => {
                  setFormMode({ type: 'create' });
                  setNombre('');
                  setCodigo('');
                  setDescripcion('');
                  setTipoUbicacionId(defaultTipoId);
                  setReactivar(false);
                  setFieldErrors({});
                }}
              >
                Agregar ubicacion
              </Button>
            ) : (
              <FormShell
                onSubmit={onSubmit}
                title={isEditing ? `Editar: ${editingItem?.nombre}` : 'Nueva ubicacion'}
                onCancel={resetForm}
                submitLabel={isEditing ? 'Guardar cambios' : 'Guardar'}
                loading={isSaving}
              >
                <Field label="Nombre" htmlFor="nombre" required error={fieldErrors.nombre}>
                  <input
                    id="nombre"
                    className={getInputClassName(Boolean(fieldErrors.nombre))}
                    placeholder="Galpon A"
                    value={nombre}
                    onChange={(e) => {
                      setNombre(e.target.value);
                      clearFieldError('nombre', setFieldErrors);
                    }}
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.nombre)}
                  />
                </Field>
                <Field label="Codigo" htmlFor="codigo">
                  <input
                    id="codigo"
                    className={getInputClassName()}
                    placeholder="GA-01"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                  />
                </Field>
                <Field label="Descripcion" htmlFor="descripcion">
                  <input
                    id="descripcion"
                    className={getInputClassName()}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </Field>
                {!isEditing ? (
                  <Field
                    label="Tipo de ubicacion"
                    htmlFor="tipoUbicacionId"
                    required
                    error={fieldErrors.tipoUbicacionId}
                  >
                    <select
                      id="tipoUbicacionId"
                      className={getInputClassName(Boolean(fieldErrors.tipoUbicacionId))}
                      value={selectedTipoId}
                      onChange={(e) => {
                        setTipoUbicacionId(e.target.value);
                        clearFieldError('tipoUbicacionId', setFieldErrors);
                      }}
                      aria-required="true"
                      aria-invalid={Boolean(fieldErrors.tipoUbicacionId)}
                    >
                      {tiposUbicacion.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
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
            {!isLoading && meta.total === 0 ? (
              <EmptyState title="Sin ubicaciones en esta granja" />
            ) : null}
            {ubicaciones.map((ubicacion) => (
              <RecordListItem
                key={ubicacion.id}
                title={ubicacion.nombre}
                details={[
                  { label: 'Codigo', value: ubicacion.codigo },
                  { label: 'Descripcion', value: ubicacion.descripcion },
                ]}
                estado={ubicacion.estadoRegistro}
                onEdit={() => {
                  setFormMode({ type: 'edit', item: ubicacion });
                  setNombre(ubicacion.nombre);
                  setCodigo(ubicacion.codigo ?? '');
                  setDescripcion(ubicacion.descripcion ?? '');
                  setReactivar(false);
                  setFieldErrors({});
                }}
                onInactivate={
                  ubicacion.estadoRegistro === 'ACTIVO'
                    ? () => setPendingInactivate(ubicacion)
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
            title="Inactivar ubicacion"
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
