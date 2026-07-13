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
  buildOptionalStringFields,
  clearFieldError,
  getRequiredFieldError,
  REQUIRED_FIELD_MESSAGE,
  type FieldErrors,
} from '@/lib/form-validation';
import { useScrollToFormOnEdit } from '@/lib/use-scroll-to-form-on-edit';

type Compania = { id: string; nombre: string };
type Granja = {
  id: string;
  nombre: string;
  codigo?: string | null;
  direccion?: string | null;
  companiaId: string;
  estadoRegistro: 'ACTIVO' | 'INACTIVO';
};

type FormMode = { type: 'create' } | { type: 'edit'; item: Granja };

export default function GranjasPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [companiaId, setCompaniaId] = useState('');
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [reactivar, setReactivar] = useState(false);
  const [pendingInactivate, setPendingInactivate] = useState<Granja | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const { data: companiasData } = useQuery({
    queryKey: ['companias', 'select'],
    queryFn: () =>
      apiFetchPaginated<Compania>('/companias', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const companias = companiasData?.items ?? [];
  const selectedCompaniaId = companiaId || companias[0]?.id || '';

  const {
    items: granjas,
    meta,
    page,
    setPage,
    search,
    setSearch,
    filtro,
    setFiltro,
    isLoading,
  } = usePaginatedList<Granja>({
    queryKey: ['granjas', selectedCompaniaId],
    apiPath: '/granjas',
    extraParams: selectedCompaniaId ? { companiaId: selectedCompaniaId } : undefined,
  });

  const isEditing = formMode?.type === 'edit';
  const editingItem = formMode?.type === 'edit' ? formMode.item : null;
  const formSectionRef = useScrollToFormOnEdit(formMode);

  function resetForm() {
    setFormMode(null);
    setNombre('');
    setCodigo('');
    setDireccion('');
    setReactivar(false);
    setFieldErrors({});
  }

  function loadGranjaForm(item: Granja) {
    setNombre(item.nombre);
    setCodigo(item.codigo ?? '');
    setDireccion(item.direccion ?? '');
    setReactivar(false);
    setFieldErrors({});
  }

  function buildPayload(): Record<string, unknown> {
    return {
      nombre: nombre.trim(),
      ...buildOptionalStringFields({ codigo, direccion }),
    };
  }

  const crear = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<Granja>('/granjas', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      resetForm();
      toast.success('Granja registrada correctamente.');
      queryClient.invalidateQueries({ queryKey: ['granjas'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'No se pudo guardar la granja.')),
  });

  const actualizar = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch<Granja>(`/granjas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      resetForm();
      toast.success('Cambios guardados correctamente.');
      queryClient.invalidateQueries({ queryKey: ['granjas'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'No se pudieron guardar los cambios.')),
  });

  const inactivar = useMutation({
    mutationFn: (id: string) =>
      apiFetch<Granja>(`/granjas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estadoRegistro: 'INACTIVO' }),
      }),
    onSuccess: () => {
      setPendingInactivate(null);
      toast.success('Granja inactivada.');
      queryClient.invalidateQueries({ queryKey: ['granjas'] });
    },
    onError: (error) => {
      setPendingInactivate(null);
      toast.error(getApiErrorMessage(error, 'No se pudo inactivar la granja.'));
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: FieldErrors = {};
    const nombreError = getRequiredFieldError(nombre);
    if (nombreError) errors.nombre = nombreError;
    if (!isEditing && !selectedCompaniaId) {
      errors.companiaId = REQUIRED_FIELD_MESSAGE;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    if (isEditing && editingItem) {
      const payload = buildPayload();
      if (editingItem.estadoRegistro === 'INACTIVO' && reactivar) {
        payload.estadoRegistro = 'ACTIVO';
      }
      actualizar.mutate({ id: editingItem.id, payload });
      return;
    }

    if (!selectedCompaniaId) return;
    crear.mutate({
      companiaId: selectedCompaniaId,
      ...buildPayload(),
    });
  }

  const isSaving = crear.isPending || actualizar.isPending;

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/configuracion"
        backLabel="Configuracion"
        title="Granjas"
        description="Unidades productivas asociadas a cada compania."
      />

      <Field
        label="Compania"
        htmlFor="compania"
        required
        error={fieldErrors.companiaId}
      >
        <select
          id="compania"
          className={getInputClassName(Boolean(fieldErrors.companiaId))}
          value={selectedCompaniaId}
          onChange={(e) => {
            setCompaniaId(e.target.value);
            clearFieldError('companiaId', setFieldErrors);
          }}
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.companiaId)}
        >
          {companias.map((compania) => (
            <option key={compania.id} value={compania.id}>
              {compania.nombre}
            </option>
          ))}
        </select>
      </Field>

      <div ref={formSectionRef} className="scroll-mt-20">
        {!formMode ? (
          <Button
            type="button"
            fullWidth
            disabled={!selectedCompaniaId}
            onClick={() => {
              setFormMode({ type: 'create' });
              setNombre('');
              setCodigo('');
              setDireccion('');
              setReactivar(false);
              setFieldErrors({});
            }}
          >
            Nueva granja
          </Button>
        ) : (
          <FormShell
            onSubmit={onSubmit}
            title={isEditing ? `Editar: ${editingItem?.nombre}` : 'Nueva granja'}
            onCancel={resetForm}
            submitLabel={isEditing ? 'Guardar cambios' : 'Guardar'}
            loading={isSaving}
          >
            <Field
              label="Nombre de la granja"
              htmlFor="granja-nombre"
              required
              error={fieldErrors.nombre}
            >
              <input
                id="granja-nombre"
                className={getInputClassName(Boolean(fieldErrors.nombre))}
                placeholder="Granja Norte"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  clearFieldError('nombre', setFieldErrors);
                }}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.nombre)}
              />
            </Field>
            <Field label="Codigo" htmlFor="granja-codigo">
              <input
                id="granja-codigo"
                className={getInputClassName()}
                placeholder="GN-01"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </Field>
            <Field label="Direccion" htmlFor="granja-direccion">
              <input
                id="granja-direccion"
                className={getInputClassName()}
                placeholder="Ruta, ciudad o referencia"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
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
        {!isLoading && meta.total === 0 ? (
          <EmptyState title="Sin granjas en esta compania" />
        ) : null}
        {granjas.map((granja) => (
          <RecordListItem
            key={granja.id}
            title={granja.nombre}
            details={[
              { label: 'Codigo', value: granja.codigo },
              { label: 'Direccion', value: granja.direccion },
            ]}
            estado={granja.estadoRegistro}
            onEdit={() => {
              setFormMode({ type: 'edit', item: granja });
              loadGranjaForm(granja);
            }}
            onInactivate={
              granja.estadoRegistro === 'ACTIVO' ? () => setPendingInactivate(granja) : undefined
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
        title="Inactivar granja"
        description={`"${pendingInactivate?.nombre}" dejara de estar disponible para nuevas operaciones.`}
        confirmLabel="Si, inactivar"
        loading={inactivar.isPending}
        onCancel={() => setPendingInactivate(null)}
        onConfirm={() => pendingInactivate && inactivar.mutate(pendingInactivate.id)}
      />
    </div>
  );
}
