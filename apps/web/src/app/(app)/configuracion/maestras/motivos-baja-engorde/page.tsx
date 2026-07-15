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

type MotivoBaja = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  cuentaComoMortalidad: boolean;
  estadoRegistro: 'ACTIVO' | 'INACTIVO';
};

type FormMode = { type: 'create' } | { type: 'edit'; item: MotivoBaja };

export default function MotivosBajaEngordePage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [mode, setMode] = useState<FormMode | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cuentaComoMortalidad, setCuentaComoMortalidad] = useState(false);
  const [reactivar, setReactivar] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pendingInactivate, setPendingInactivate] = useState<MotivoBaja | null>(null);
  const formRef = useScrollToFormOnEdit(mode);

  const { items, meta, page, setPage, search, setSearch, filtro, setFiltro, isLoading, isError } =
    usePaginatedList<MotivoBaja>({
      queryKey: ['motivos-baja-engorde'],
      apiPath: '/motivos-baja-engorde',
    });

  function resetForm() {
    setMode(null);
    setNombre('');
    setDescripcion('');
    setCuentaComoMortalidad(false);
    setReactivar(false);
    setFieldErrors({});
  }

  function openCreate() {
    setMode({ type: 'create' });
    setNombre('');
    setDescripcion('');
    setCuentaComoMortalidad(false);
    setReactivar(false);
    setFieldErrors({});
  }

  function openEdit(item: MotivoBaja) {
    setMode({ type: 'edit', item });
    setNombre(item.nombre);
    setDescripcion(item.descripcion ?? '');
    setCuentaComoMortalidad(item.cuentaComoMortalidad);
    setReactivar(false);
    setFieldErrors({});
  }

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch('/motivos-baja-engorde', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success('Motivo creado.');
      void queryClient.invalidateQueries({ queryKey: ['motivos-baja-engorde'] });
      resetForm();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo crear el motivo.')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch(`/motivos-baja-engorde/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success('Motivo actualizado.');
      void queryClient.invalidateQueries({ queryKey: ['motivos-baja-engorde'] });
      resetForm();
      setPendingInactivate(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo actualizar el motivo.')),
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

    if (mode?.type === 'create') {
      createMutation.mutate({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        cuentaComoMortalidad,
      });
      return;
    }

    if (mode?.type === 'edit') {
      const payload: Record<string, unknown> = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        cuentaComoMortalidad,
      };
      if (mode.item.estadoRegistro === 'INACTIVO' && reactivar) {
        payload.estadoRegistro = 'ACTIVO';
      }
      updateMutation.mutate({ id: mode.item.id, payload });
    }
  }

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/configuracion/maestras"
        backLabel="Catalogos"
        title="Motivos de baja de engorde"
        description="Salidas del lote durante el engorde. Indique si cuenta como mortalidad."
      />

      <div className="flex justify-end">
        <Button type="button" onClick={openCreate}>
          Agregar motivo
        </Button>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        filtro={filtro}
        onFiltroChange={setFiltro}
        resultCount={meta.total}
      />

      {mode ? (
        <div ref={formRef}>
          <FormShell
            onSubmit={handleSubmit}
            title={mode.type === 'create' ? 'Nuevo motivo' : `Editar: ${mode.item.nombre}`}
            onCancel={resetForm}
            submitLabel="Guardar"
            loading={createMutation.isPending || updateMutation.isPending}
          >
            <Field label="Nombre" htmlFor="nombre" required error={fieldErrors.nombre}>
              <input
                id="nombre"
                className={getInputClassName(!!fieldErrors.nombre)}
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  clearFieldError('nombre', setFieldErrors);
                }}
                placeholder="Ej. Muerte"
              />
            </Field>
            <Field label="Descripcion" htmlFor="descripcion">
              <textarea
                id="descripcion"
                className={getInputClassName()}
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </Field>
            <label className="flex min-h-11 items-center gap-3 rounded-xl bg-primary/[0.04] px-3 py-2 text-sm ring-1 ring-primary/10">
              <input
                type="checkbox"
                checked={cuentaComoMortalidad}
                onChange={(e) => setCuentaComoMortalidad(e.target.checked)}
              />
              Cuenta como mortalidad
            </label>
            {mode.type === 'edit' && mode.item.estadoRegistro === 'INACTIVO' ? (
              <ReactivateField checked={reactivar} onChange={setReactivar} />
            ) : null}
          </FormShell>
        </div>
      ) : null}

      {isError ? (
        <p className="text-sm text-danger">No se pudieron cargar los motivos.</p>
      ) : null}
      {isLoading ? <p className="text-sm text-muted">Cargando...</p> : null}
      {!isLoading && items.length === 0 ? (
        <EmptyState
          title="Aun no hay motivos de baja"
          description="Agregue motivos como muerte, descarte o venta parcial."
          action={
            <Button type="button" onClick={openCreate}>
              Agregar motivo
            </Button>
          }
        />
      ) : null}

      <div className="grid gap-3">
        {items.map((item) => (
          <RecordListItem
            key={item.id}
            title={item.nombre}
            details={[
              {
                label: 'Mortalidad',
                value: item.cuentaComoMortalidad ? 'Si' : 'No',
              },
            ]}
            extra={item.descripcion}
            estado={item.estadoRegistro}
            onEdit={() => openEdit(item)}
            onInactivate={
              item.estadoRegistro === 'ACTIVO' ? () => setPendingInactivate(item) : undefined
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
        loading={isLoading}
      />

      <ConfirmDialog
        open={!!pendingInactivate}
        title="Inactivar motivo"
        description={`Se inactivara "${pendingInactivate?.nombre}". Seguira visible en historiales.`}
        confirmLabel="Inactivar"
        loading={updateMutation.isPending}
        onCancel={() => setPendingInactivate(null)}
        onConfirm={() => {
          if (!pendingInactivate) return;
          updateMutation.mutate({
            id: pendingInactivate.id,
            payload: { estadoRegistro: 'INACTIVO' },
          });
        }}
      />
    </div>
  );
}
