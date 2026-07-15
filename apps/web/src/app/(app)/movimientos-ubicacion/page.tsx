'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useMemo, useState } from 'react';
import { PERMISOS, hasPermission } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/data-display/empty-state';
import { PaginationBar } from '@/components/data-display/pagination-bar';
import { StatusBadge } from '@/components/data-display/status-badge';
import { useToast } from '@/components/feedback/toast';
import { Field, FormRequiredLegend, getInputClassName } from '@/components/forms/field';
import { FormActions, FormHeader, formShellClassName } from '@/components/forms/form-shell';
import { Button } from '@/components/ui/button';
import { usePaginatedList } from '@/modules/configuracion/hooks/use-paginated-list';
import { apiFetch, apiFetchPaginated, getApiErrorMessage } from '@/lib/api-client';
import {
  clearFieldError,
  REQUIRED_FIELD_MESSAGE,
  type FieldErrors,
} from '@/lib/form-validation';
import { useAuth } from '@/lib/auth-context';
import { tenantContextFromUser } from '@/lib/tenant-context';

type Lote = {
  id: string;
  codigo: string;
  estadoOperativo: string;
  ubicacionId?: string | null;
  ubicacion?: { id: string; nombre: string } | null;
};

type Ubicacion = { id: string; nombre: string };
type Motivo = { id: string; nombre: string };

type Movimiento = {
  id: string;
  fecha: string;
  anulado: boolean;
  observaciones?: string | null;
  motivoAnulacion?: string | null;
  ubicacionOrigen?: { nombre: string } | null;
  ubicacionDestino?: { nombre: string };
  motivo?: { nombre: string };
  lote?: { codigo: string };
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function MovimientosUbicacionPage() {
  const { user } = useAuth();
  const ctx = user ? tenantContextFromUser(user) : null;
  const canCreate = ctx ? hasPermission(ctx, PERMISOS.UBICACIONES_MOVIMIENTOS_CREAR) : false;
  const canAnular = ctx ? hasPermission(ctx, PERMISOS.UBICACIONES_MOVIMIENTOS_ANULAR) : false;

  return (
    <PermissionGuard permission={PERMISOS.UBICACIONES_MOVIMIENTOS_VER}>
      <Content
        granjaActivaId={user?.granjaActivaId ?? ''}
        canCreate={canCreate}
        canAnular={canAnular}
      />
    </PermissionGuard>
  );
}

function Content({
  granjaActivaId,
  canCreate,
  canAnular,
}: {
  granjaActivaId: string;
  canCreate: boolean;
  canAnular: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [filtroLoteId, setFiltroLoteId] = useState('');
  const [loteId, setLoteId] = useState('');
  const [ubicacionDestinoId, setUbicacionDestinoId] = useState('');
  const [fecha, setFecha] = useState(todayIsoDate());
  const [motivoId, setMotivoId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pendingAnular, setPendingAnular] = useState<Movimiento | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const { data: lotesData } = useQuery({
    queryKey: ['lotes', 'mov-ubicacion-select', granjaActivaId],
    enabled: !!granjaActivaId,
    queryFn: () =>
      apiFetchPaginated<Lote>('/lotes', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
        granjaId: granjaActivaId,
        estadoOperativo: 'ACTIVO',
      }),
  });

  const { data: ubicacionesData } = useQuery({
    queryKey: ['ubicaciones', 'mov-ubicacion-select', granjaActivaId],
    enabled: !!granjaActivaId,
    queryFn: () =>
      apiFetchPaginated<Ubicacion>('/ubicaciones', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
        granjaId: granjaActivaId,
      }),
  });

  const { data: motivosData } = useQuery({
    queryKey: ['motivos-movimiento-ubicacion', 'activos'],
    enabled: !!granjaActivaId,
    queryFn: () =>
      apiFetchPaginated<Motivo>('/motivos-movimiento-ubicacion', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const lotes = lotesData?.items ?? [];
  const ubicaciones = ubicacionesData?.items ?? [];
  const motivos = motivosData?.items ?? [];
  const selectedLote = lotes.find((item) => item.id === (loteId || filtroLoteId));

  const { items, meta, page, setPage, isLoading, isError } = usePaginatedList<Movimiento>({
    queryKey: ['movimientos-ubicacion', granjaActivaId, filtroLoteId],
    apiPath: '/movimientos-ubicacion',
    extraParams: {
      ...(granjaActivaId ? { granjaId: granjaActivaId } : {}),
      ...(filtroLoteId ? { loteId: filtroLoteId } : {}),
      incluirAnulados: 'true',
    },
    enabled: !!granjaActivaId,
    estadoParam: 'estado',
  });

  const ultimoVigenteId = useMemo(() => {
    const vigente = items.find((item) => !item.anulado);
    return vigente?.id ?? null;
  }, [items]);

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<Movimiento>('/movimientos-ubicacion', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success('Movimiento registrado.');
      void queryClient.invalidateQueries({ queryKey: ['movimientos-ubicacion'] });
      void queryClient.invalidateQueries({ queryKey: ['lotes'] });
      setShowForm(false);
      setLoteId('');
      setUbicacionDestinoId('');
      setFecha(todayIsoDate());
      setMotivoId('');
      setObservaciones('');
      setFieldErrors({});
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo registrar el movimiento.'));
    },
  });

  const anularMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      apiFetch<Movimiento>(`/movimientos-ubicacion/${id}/anular`, {
        method: 'POST',
        body: JSON.stringify({ motivo }),
      }),
    onSuccess: () => {
      toast.success('Movimiento anulado.');
      void queryClient.invalidateQueries({ queryKey: ['movimientos-ubicacion'] });
      void queryClient.invalidateQueries({ queryKey: ['lotes'] });
      setPendingAnular(null);
      setMotivoAnulacion('');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo anular el movimiento.'));
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: FieldErrors = {};
    if (!loteId) errors.loteId = REQUIRED_FIELD_MESSAGE;
    if (!ubicacionDestinoId) errors.ubicacionDestinoId = REQUIRED_FIELD_MESSAGE;
    if (!fecha) errors.fecha = REQUIRED_FIELD_MESSAGE;
    if (!motivoId) errors.motivoId = REQUIRED_FIELD_MESSAGE;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    createMutation.mutate({
      granjaId: granjaActivaId,
      loteId,
      ubicacionDestinoId,
      fecha,
      motivoId,
      observaciones: observaciones.trim() || undefined,
    });
  }

  if (!granjaActivaId) {
    return (
      <div className="space-y-5 pb-24">
        <PageHeader
          backHref="/lotes"
          backLabel="Lotes"
          title="Movimientos de ubicacion"
          description="Trasladá lotes entre ubicaciones de la granja."
        />
        <EmptyState
          title="Selecciona una granja activa"
          description="Usa el selector del encabezado para continuar."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/lotes"
        backLabel="Lotes"
        title="Movimientos de ubicacion"
        description="Registra cambios de ubicacion interna con historial auditable."
      />

      <section className="rounded-3xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10">
        <p className="text-sm font-semibold">Ubicacion actual del lote</p>
        <p className="mt-1 text-sm text-muted">
          {selectedLote
            ? selectedLote.ubicacion?.nombre ?? 'Sin ubicacion asignada'
            : 'Selecciona un lote para ver su ubicacion.'}
        </p>
      </section>

      {canCreate ? (
        <div>
          {!showForm ? (
            <Button type="button" fullWidth onClick={() => setShowForm(true)}>
              Registrar movimiento
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className={formShellClassName}>
              <FormHeader title="Nuevo movimiento" />
              <FormRequiredLegend />
              <Field label="Lote" htmlFor="mov-lote" required error={fieldErrors.loteId}>
                <select
                  id="mov-lote"
                  className={getInputClassName(Boolean(fieldErrors.loteId))}
                  value={loteId}
                  onChange={(e) => {
                    setLoteId(e.target.value);
                    clearFieldError('loteId', setFieldErrors);
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {lotes.map((lote) => (
                    <option key={lote.id} value={lote.id}>
                      {lote.codigo}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Ubicacion destino"
                htmlFor="mov-destino"
                required
                error={fieldErrors.ubicacionDestinoId}
              >
                <select
                  id="mov-destino"
                  className={getInputClassName(Boolean(fieldErrors.ubicacionDestinoId))}
                  value={ubicacionDestinoId}
                  onChange={(e) => {
                    setUbicacionDestinoId(e.target.value);
                    clearFieldError('ubicacionDestinoId', setFieldErrors);
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {ubicaciones.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha" htmlFor="mov-fecha" required error={fieldErrors.fecha}>
                <input
                  id="mov-fecha"
                  type="date"
                  className={getInputClassName(Boolean(fieldErrors.fecha))}
                  value={fecha}
                  onChange={(e) => {
                    setFecha(e.target.value);
                    clearFieldError('fecha', setFieldErrors);
                  }}
                />
              </Field>
              <Field label="Motivo" htmlFor="mov-motivo" required error={fieldErrors.motivoId}>
                <select
                  id="mov-motivo"
                  className={getInputClassName(Boolean(fieldErrors.motivoId))}
                  value={motivoId}
                  onChange={(e) => {
                    setMotivoId(e.target.value);
                    clearFieldError('motivoId', setFieldErrors);
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {motivos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Observaciones" htmlFor="mov-obs">
                <textarea
                  id="mov-obs"
                  className={getInputClassName()}
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </Field>
              <FormActions
                loading={createMutation.isPending}
                onCancel={() => setShowForm(false)}
                submitLabel="Guardar movimiento"
              />
            </form>
          )}
        </div>
      ) : null}

      <Field label="Filtrar historial por lote" htmlFor="filtro-lote">
        <select
          id="filtro-lote"
          className={getInputClassName()}
          value={filtroLoteId}
          onChange={(e) => {
            setFiltroLoteId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos</option>
          {lotes.map((lote) => (
            <option key={lote.id} value={lote.id}>
              {lote.codigo}
            </option>
          ))}
        </select>
      </Field>

      {isLoading ? <p className="text-sm text-muted">Cargando historial…</p> : null}
      {isError ? (
        <p className="text-sm text-danger">No se pudo cargar el historial.</p>
      ) : null}
      {!isLoading && !isError && items.length === 0 ? (
        <EmptyState
          title="Sin movimientos"
          description="Cuando registres el primer traslado, aparecera aqui."
        />
      ) : null}

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.lote?.codigo ?? 'Lote'}</p>
                <p className="text-sm text-muted">
                  {item.fecha} · {item.ubicacionOrigen?.nombre ?? 'Sin origen'} →{' '}
                  {item.ubicacionDestino?.nombre}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Motivo: {item.motivo?.nombre ?? '—'}
                  {item.observaciones ? ` · ${item.observaciones}` : ''}
                </p>
              </div>
              <StatusBadge estado={item.anulado ? 'ANULADO' : 'ACTIVO'} />
            </div>
            {canAnular && !item.anulado && item.id === ultimoVigenteId ? (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setPendingAnular(item)}
                >
                  Anular ultimo movimiento
                </Button>
              </div>
            ) : null}
            {item.anulado && item.motivoAnulacion ? (
              <p className="mt-2 text-xs text-muted">Anulacion: {item.motivoAnulacion}</p>
            ) : null}
          </li>
        ))}
      </ul>

      {meta.total > 0 ? (
        <PaginationBar
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={meta.limit}
          onPageChange={setPage}
        />
      ) : null}

      {pendingAnular ? (
        <form
          className={formShellClassName}
          onSubmit={(event) => {
            event.preventDefault();
            if (motivoAnulacion.trim().length < 3) {
              toast.error('Indica un motivo de al menos 3 caracteres.');
              return;
            }
            anularMutation.mutate({ id: pendingAnular.id, motivo: motivoAnulacion.trim() });
          }}
        >
          <FormHeader title="Anular movimiento" description="Solo el ultimo vigente." />
          <Field label="Motivo de anulacion" htmlFor="motivo-anulacion" required>
            <textarea
              id="motivo-anulacion"
              className={getInputClassName()}
              rows={3}
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
            />
          </Field>
          <FormActions
            loading={anularMutation.isPending}
            onCancel={() => {
              setPendingAnular(null);
              setMotivoAnulacion('');
            }}
            submitLabel="Confirmar anulacion"
          />
        </form>
      ) : null}

      <Link href="/lotes" className="inline-flex text-sm font-semibold text-primary">
        Volver a lotes
      </Link>
    </div>
  );
}
