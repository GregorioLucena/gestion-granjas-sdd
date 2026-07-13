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
  buildOptionalStringFields,
  clearFieldError,
  getEmailFieldError,
  getRequiredFieldError,
  type FieldErrors,
} from '@/lib/form-validation';
import { useScrollToFormOnEdit } from '@/lib/use-scroll-to-form-on-edit';

type Compania = {
  id: string;
  nombre: string;
  estadoRegistro: 'ACTIVO' | 'INACTIVO';
  identificacionFiscal?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
};

type FormMode = { type: 'create' } | { type: 'edit'; item: Compania };


export default function CompaniasPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [nombre, setNombre] = useState('');
  const [identificacionFiscal, setIdentificacionFiscal] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [reactivar, setReactivar] = useState(false);
  const [pendingInactivate, setPendingInactivate] = useState<Compania | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const {
    items: companias,
    meta,
    page,
    setPage,
    search,
    setSearch,
    filtro,
    setFiltro,
    isLoading,
    isError,
  } = usePaginatedList<Compania>({
    queryKey: ['companias'],
    apiPath: '/companias',
  });

  const isEditing = formMode?.type === 'edit';
  const editingItem = formMode?.type === 'edit' ? formMode.item : null;
  const formSectionRef = useScrollToFormOnEdit(formMode);

  function resetContactFields() {
    setIdentificacionFiscal('');
    setTelefono('');
    setCorreo('');
    setDireccion('');
  }

  function loadCompaniaForm(item: Compania) {
    setNombre(item.nombre);
    setIdentificacionFiscal(item.identificacionFiscal ?? '');
    setTelefono(item.telefono ?? '');
    setCorreo(item.correo ?? '');
    setDireccion(item.direccion ?? '');
    setReactivar(false);
    setFieldErrors({});
  }

  function resetForm() {
    setFormMode(null);
    setNombre('');
    resetContactFields();
    setReactivar(false);
    setFieldErrors({});
  }

  function buildPayload(): Record<string, unknown> {
    return {
      nombre: nombre.trim(),
      ...buildOptionalStringFields({
        identificacionFiscal,
        telefono,
        correo,
        direccion,
      }),
    };
  }

  const crear = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<Compania>('/companias', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      resetForm();
      toast.success('Compania registrada correctamente.');
      queryClient.invalidateQueries({ queryKey: ['companias'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'Ya existe una compania con ese nombre.')),
  });

  const actualizar = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch<Compania>(`/companias/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      resetForm();
      toast.success('Cambios guardados correctamente.');
      queryClient.invalidateQueries({ queryKey: ['companias'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'No se pudieron guardar los cambios.')),
  });

  const inactivar = useMutation({
    mutationFn: (id: string) =>
      apiFetch<Compania>(`/companias/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estadoRegistro: 'INACTIVO' }),
      }),
    onSuccess: () => {
      setPendingInactivate(null);
      toast.success('Compania inactivada.');
      queryClient.invalidateQueries({ queryKey: ['companias'] });
    },
    onError: (error) => {
      setPendingInactivate(null);
      toast.error(getApiErrorMessage(error, 'No se pudo inactivar la compania.'));
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: FieldErrors = {};
    const nombreError = getRequiredFieldError(nombre);
    if (nombreError) errors.nombre = nombreError;

    const correoError = getEmailFieldError(correo);
    if (correoError) errors.correo = correoError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const payload = buildPayload();

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
        backHref="/configuracion"
        backLabel="Configuracion"
        title="Companias"
        description="Organizaciones que administran una o varias granjas."
      />

      <div className="rounded-2xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Resultados</p>
        <p className="mt-1 text-2xl font-bold text-primary">{meta.total}</p>
      </div>

      <div ref={formSectionRef} className="scroll-mt-20">
        {!formMode ? (
          <Button
            type="button"
            fullWidth
            onClick={() => {
              setFormMode({ type: 'create' });
              setNombre('');
              resetContactFields();
              setReactivar(false);
              setFieldErrors({});
            }}
          >
            Nueva compania
          </Button>
        ) : (
          <FormShell
            onSubmit={onSubmit}
            title={isEditing ? `Editar: ${editingItem?.nombre}` : 'Nueva compania'}
            onCancel={resetForm}
            submitLabel={isEditing ? 'Guardar cambios' : 'Guardar'}
            loading={isSaving}
          >
            <Field label="Nombre" htmlFor="compania-nombre" required error={fieldErrors.nombre}>
              <input
                id="compania-nombre"
                className={getInputClassName(Boolean(fieldErrors.nombre))}
                placeholder="Productora La Esperanza"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  clearFieldError('nombre', setFieldErrors);
                }}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.nombre)}
              />
            </Field>
            <Field label="Identificacion fiscal" htmlFor="compania-identificacion">
              <input
                id="compania-identificacion"
                className={getInputClassName()}
                placeholder="RUC, NIT o equivalente"
                value={identificacionFiscal}
                onChange={(e) => setIdentificacionFiscal(e.target.value)}
              />
            </Field>
            <Field label="Telefono" htmlFor="compania-telefono">
              <input
                id="compania-telefono"
                type="tel"
                className={getInputClassName()}
                placeholder="+595 981 000000"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </Field>
            <Field label="Correo" htmlFor="compania-correo" error={fieldErrors.correo}>
              <input
                id="compania-correo"
                type="email"
                className={getInputClassName(Boolean(fieldErrors.correo))}
                placeholder="contacto@empresa.com"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value);
                  clearFieldError('correo', setFieldErrors);
                }}
                aria-invalid={Boolean(fieldErrors.correo)}
              />
            </Field>
            <Field label="Direccion" htmlFor="compania-direccion">
              <input
                id="compania-direccion"
                className={getInputClassName()}
                placeholder="Ciudad, calle o referencia"
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
        {isError ? <p className="text-sm text-danger">Error al cargar companias.</p> : null}
        {!isLoading && meta.total === 0 && !search && filtro === 'ACTIVO' ? (
          <EmptyState title="Aun no hay companias registradas" />
        ) : null}
        {!isLoading && meta.total === 0 && (search || filtro !== 'ACTIVO') ? (
          <EmptyState title="Sin resultados" description="Prueba otro texto o cambia el filtro." />
        ) : null}
        {companias.map((compania) => (
          <RecordListItem
            key={compania.id}
            title={compania.nombre}
            details={[
              { label: 'ID fiscal', value: compania.identificacionFiscal },
              { label: 'Telefono', value: compania.telefono },
              { label: 'Correo', value: compania.correo },
              { label: 'Direccion', value: compania.direccion },
            ]}
            estado={compania.estadoRegistro}
            onEdit={() => {
              setFormMode({ type: 'edit', item: compania });
              loadCompaniaForm(compania);
            }}
            onInactivate={
              compania.estadoRegistro === 'ACTIVO'
                ? () => setPendingInactivate(compania)
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
        title="Inactivar compania"
        description={`"${pendingInactivate?.nombre}" dejara de estar disponible para nuevas operaciones.`}
        confirmLabel="Si, inactivar"
        loading={inactivar.isPending}
        onCancel={() => setPendingInactivate(null)}
        onConfirm={() => pendingInactivate && inactivar.mutate(pendingInactivate.id)}
      />
    </div>
  );
}
