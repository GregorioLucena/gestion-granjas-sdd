'use client';

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

type TipoMovimiento = {
  id: string;
  codigo: string;
  nombre: string;
  esAjuste: boolean;
};

type Alimento = { id: string; nombre: string; unidadMedida?: { abreviatura: string } };
type Almacen = { id: string; nombre: string };
type Proveedor = { id: string; nombre: string };

type Movimiento = {
  id: string;
  fecha: string;
  cantidad: string | number;
  costoUnitario?: string | number | null;
  referencia?: string | null;
  motivoAjuste?: string | null;
  observaciones?: string | null;
  anulado: boolean;
  alimento?: Alimento;
  almacen?: Almacen;
  tipoMovimiento?: TipoMovimiento;
  proveedor?: Proveedor | null;
  unidadMedida?: { abreviatura: string };
};

type MovimientoTab = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

const ENTRADA_CODES = ['ENTRADA_COMPRA', 'ENTRADA_MANUAL'];
const SALIDA_CODES = ['SALIDA_MANUAL'];
const AJUSTE_CODES = ['AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO'];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function MovimientosPage() {
  const { user } = useAuth();
  const ctx = user ? tenantContextFromUser(user) : null;
  const canMovimientos = ctx ? hasPermission(ctx, PERMISOS.INVENTARIO_MOVIMIENTOS_CREAR) : false;
  const canAjustes = ctx ? hasPermission(ctx, PERMISOS.INVENTARIO_AJUSTES_CREAR) : false;

  return (
    <PermissionGuard permission={PERMISOS.INVENTARIO_VER}>
      <MovimientosContent
        granjaActivaId={user?.granjaActivaId ?? ''}
        canMovimientos={canMovimientos}
        canAjustes={canAjustes}
      />
    </PermissionGuard>
  );
}

function MovimientosContent({
  granjaActivaId,
  canMovimientos,
  canAjustes,
}: {
  granjaActivaId: string;
  canMovimientos: boolean;
  canAjustes: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<MovimientoTab>('ENTRADA');
  const [almacenId, setAlmacenId] = useState('');
  const [alimentoId, setAlimentoId] = useState('');
  const [tipoMovimientoId, setTipoMovimientoId] = useState('');
  const [fecha, setFecha] = useState(todayIsoDate());
  const [cantidad, setCantidad] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [referencia, setReferencia] = useState('');
  const [motivoAjuste, setMotivoAjuste] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pendingAnular, setPendingAnular] = useState<Movimiento | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const canCreate =
    (tab === 'AJUSTE' && canAjustes) || (tab !== 'AJUSTE' && canMovimientos);

  const { data: tiposData } = useQuery({
    queryKey: ['tipos-movimiento-inventario'],
    queryFn: () => apiFetch<TipoMovimiento[]>('/tipos-movimiento-inventario'),
  });

  const { data: almacenesData } = useQuery({
    queryKey: ['almacenes', 'select', granjaActivaId],
    enabled: !!granjaActivaId,
    queryFn: () =>
      apiFetchPaginated<Almacen>('/almacenes', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
        granjaId: granjaActivaId,
      }),
  });

  const { data: alimentosData } = useQuery({
    queryKey: ['alimentos', 'select'],
    queryFn: () =>
      apiFetchPaginated<Alimento>('/alimentos', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const { data: proveedoresData } = useQuery({
    queryKey: ['proveedores', 'select'],
    queryFn: () =>
      apiFetchPaginated<Proveedor>('/proveedores', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const tipos = useMemo(() => tiposData ?? [], [tiposData]);
  const almacenes = almacenesData?.items ?? [];
  const alimentos = alimentosData?.items ?? [];
  const proveedores = proveedoresData?.items ?? [];

  const tiposFiltrados = useMemo(() => {
    const codes =
      tab === 'ENTRADA' ? ENTRADA_CODES : tab === 'SALIDA' ? SALIDA_CODES : AJUSTE_CODES;
    return tipos.filter((tipo) => codes.includes(tipo.codigo));
  }, [tab, tipos]);

  const selectedAlimento = alimentos.find((item) => item.id === alimentoId);
  const unidadLabel = selectedAlimento?.unidadMedida?.abreviatura ?? 'unidad';

  const { items, meta, page, setPage, isLoading, isError } = usePaginatedList<Movimiento>({
    queryKey: ['movimientos-inventario', granjaActivaId],
    apiPath: '/movimientos-inventario',
    extraParams: granjaActivaId ? { granjaId: granjaActivaId } : undefined,
    enabled: !!granjaActivaId,
    estadoParam: 'estado',
  });

  function resetForm() {
    setShowForm(false);
    setAlmacenId('');
    setAlimentoId('');
    setTipoMovimientoId('');
    setFecha(todayIsoDate());
    setCantidad('');
    setCostoUnitario('');
    setProveedorId('');
    setReferencia('');
    setMotivoAjuste('');
    setObservaciones('');
    setFieldErrors({});
  }

  function openForm(nextTab: MovimientoTab) {
    const codes =
      nextTab === 'ENTRADA' ? ENTRADA_CODES : nextTab === 'SALIDA' ? SALIDA_CODES : AJUSTE_CODES;
    const filtered = tipos.filter((tipo) => codes.includes(tipo.codigo));

    setTab(nextTab);
    setShowForm(true);
    setAlmacenId(almacenes[0]?.id ?? '');
    setAlimentoId(alimentos[0]?.id ?? '');
    setTipoMovimientoId(filtered[0]?.id ?? '');
    setFecha(todayIsoDate());
    setCantidad('');
    setCostoUnitario('');
    setProveedorId('');
    setReferencia('');
    setMotivoAjuste('');
    setObservaciones('');
    setFieldErrors({});
  }

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<Movimiento>('/movimientos-inventario', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success('Movimiento registrado.');
      void queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] });
      void queryClient.invalidateQueries({ queryKey: ['existencias-inventario'] });
      resetForm();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo registrar el movimiento.'));
    },
  });

  const anularMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      apiFetch<Movimiento>(`/movimientos-inventario/${id}/anular`, {
        method: 'PATCH',
        body: JSON.stringify({ motivoAnulacion: motivo }),
      }),
    onSuccess: () => {
      toast.success('Movimiento anulado.');
      void queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] });
      void queryClient.invalidateQueries({ queryKey: ['existencias-inventario'] });
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
    if (!almacenId) errors.almacenId = REQUIRED_FIELD_MESSAGE;
    if (!alimentoId) errors.alimentoId = REQUIRED_FIELD_MESSAGE;
    if (!tipoMovimientoId) errors.tipoMovimientoId = REQUIRED_FIELD_MESSAGE;
    if (!fecha) errors.fecha = REQUIRED_FIELD_MESSAGE;
    if (!cantidad || Number(cantidad) <= 0) errors.cantidad = 'Debe ser mayor que cero.';
    if (tab === 'AJUSTE' && !motivoAjuste.trim()) {
      errors.motivoAjuste = REQUIRED_FIELD_MESSAGE;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    createMutation.mutate({
      granjaId: granjaActivaId,
      almacenId,
      alimentoId,
      tipoMovimientoId,
      fecha,
      cantidad: Number(cantidad),
      costoUnitario: costoUnitario.trim() ? Number(costoUnitario) : undefined,
      proveedorId: proveedorId || undefined,
      referencia: referencia.trim() || undefined,
      motivoAjuste: motivoAjuste.trim() || undefined,
      observaciones: observaciones.trim() || undefined,
    });
  }

  if (!granjaActivaId) {
    return (
      <div className="space-y-5 pb-24">
        <PageHeader
          backHref="/inventario"
          backLabel="Inventario"
          title="Movimientos"
          description="Entradas, salidas y ajustes de inventario."
        />
        <EmptyState
          title="Selecciona una granja activa"
          description="Usa el selector del encabezado para registrar movimientos."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/inventario"
        backLabel="Inventario"
        title="Movimientos"
        description="Historial y registro de entradas, salidas y ajustes."
      />

      {(canMovimientos || canAjustes) && (
        <div className="scroll-mt-20">
          {!showForm ? (
            <div className="flex flex-wrap gap-2">
              {canMovimientos ? (
                <>
                  <Button type="button" variant="outline" fullWidth onClick={() => openForm('ENTRADA')}>
                    Entrada
                  </Button>
                  <Button type="button" variant="outline" fullWidth onClick={() => openForm('SALIDA')}>
                    Salida
                  </Button>
                </>
              ) : null}
              {canAjustes ? (
                <Button type="button" fullWidth onClick={() => openForm('AJUSTE')}>
                  Ajuste
                </Button>
              ) : null}
            </div>
          ) : canCreate ? (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-black/5"
            >
              <p className="text-sm font-semibold text-muted">
                {tab === 'ENTRADA' && 'Nueva entrada'}
                {tab === 'SALIDA' && 'Nueva salida manual'}
                {tab === 'AJUSTE' && 'Nuevo ajuste'}
              </p>
              <FormRequiredLegend />
              <Field
                label="Tipo"
                htmlFor="movimiento-tipo"
                required
                error={fieldErrors.tipoMovimientoId}
              >
                <select
                  id="movimiento-tipo"
                  className={getInputClassName(Boolean(fieldErrors.tipoMovimientoId))}
                  value={tipoMovimientoId}
                  onChange={(e) => {
                    setTipoMovimientoId(e.target.value);
                    clearFieldError('tipoMovimientoId', setFieldErrors);
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {tiposFiltrados.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Almacen"
                htmlFor="movimiento-almacen"
                required
                error={fieldErrors.almacenId}
              >
                <select
                  id="movimiento-almacen"
                  className={getInputClassName(Boolean(fieldErrors.almacenId))}
                  value={almacenId}
                  onChange={(e) => {
                    setAlmacenId(e.target.value);
                    clearFieldError('almacenId', setFieldErrors);
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {almacenes.map((almacen) => (
                    <option key={almacen.id} value={almacen.id}>
                      {almacen.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Alimento"
                htmlFor="movimiento-alimento"
                required
                error={fieldErrors.alimentoId}
              >
                <select
                  id="movimiento-alimento"
                  className={getInputClassName(Boolean(fieldErrors.alimentoId))}
                  value={alimentoId}
                  onChange={(e) => {
                    setAlimentoId(e.target.value);
                    clearFieldError('alimentoId', setFieldErrors);
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {alimentos.map((alimento) => (
                    <option key={alimento.id} value={alimento.id}>
                      {alimento.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha" htmlFor="movimiento-fecha" required error={fieldErrors.fecha}>
                <input
                  id="movimiento-fecha"
                  type="date"
                  className={getInputClassName(Boolean(fieldErrors.fecha))}
                  value={fecha}
                  onChange={(e) => {
                    setFecha(e.target.value);
                    clearFieldError('fecha', setFieldErrors);
                  }}
                />
              </Field>
              <Field
                label={`Cantidad (${unidadLabel})`}
                htmlFor="movimiento-cantidad"
                required
                error={fieldErrors.cantidad}
              >
                <input
                  id="movimiento-cantidad"
                  type="number"
                  min="0.0001"
                  step="any"
                  className={getInputClassName(Boolean(fieldErrors.cantidad))}
                  value={cantidad}
                  onChange={(e) => {
                    setCantidad(e.target.value);
                    clearFieldError('cantidad', setFieldErrors);
                  }}
                />
              </Field>
              {tab !== 'SALIDA' ? (
                <Field label="Costo unitario" htmlFor="movimiento-costo">
                  <input
                    id="movimiento-costo"
                    type="number"
                    min="0"
                    step="any"
                    className={getInputClassName()}
                    value={costoUnitario}
                    onChange={(e) => setCostoUnitario(e.target.value)}
                  />
                </Field>
              ) : null}
              {tab === 'ENTRADA' ? (
                <Field label="Proveedor" htmlFor="movimiento-proveedor">
                  <select
                    id="movimiento-proveedor"
                    className={getInputClassName()}
                    value={proveedorId}
                    onChange={(e) => setProveedorId(e.target.value)}
                  >
                    <option value="">Sin proveedor</option>
                    {proveedores.map((proveedor) => (
                      <option key={proveedor.id} value={proveedor.id}>
                        {proveedor.nombre}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
              {tab === 'AJUSTE' ? (
                <Field
                  label="Motivo del ajuste"
                  htmlFor="movimiento-motivo"
                  required
                  error={fieldErrors.motivoAjuste}
                >
                  <input
                    id="movimiento-motivo"
                    className={getInputClassName(Boolean(fieldErrors.motivoAjuste))}
                    value={motivoAjuste}
                    onChange={(e) => {
                      setMotivoAjuste(e.target.value);
                      clearFieldError('motivoAjuste', setFieldErrors);
                    }}
                  />
                </Field>
              ) : null}
              <Field label="Referencia" htmlFor="movimiento-referencia">
                <input
                  id="movimiento-referencia"
                  className={getInputClassName()}
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Factura, remito..."
                />
              </Field>
              <Field label="Observaciones" htmlFor="movimiento-observaciones">
                <textarea
                  id="movimiento-observaciones"
                  className={`${getInputClassName()} min-h-16 py-3`}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={2}
                />
              </Field>
              <div className="flex gap-2">
                <Button type="button" variant="outline" fullWidth onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" fullWidth disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Guardando...' : 'Registrar movimiento'}
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      )}

      <section className="space-y-3">
        {isLoading ? <p className="text-sm text-muted">Cargando movimientos...</p> : null}
        {isError ? <p className="text-sm text-danger">No se pudieron cargar los movimientos.</p> : null}
        {!isLoading && !isError && meta.total === 0 ? (
          <EmptyState
            title="Aun no hay movimientos"
            description="Usa Entrada en la parte superior para iniciar el historial."
          />
        ) : null}
        {items.map((item) => (
          <article
            key={item.id}
            className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-black/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">
                  {item.tipoMovimiento?.nombre ?? 'Movimiento'}
                </h3>
                <p className="text-sm text-muted">
                  {item.fecha} · {item.alimento?.nombre} · {item.almacen?.nombre}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {item.cantidad} {item.unidadMedida?.abreviatura ?? ''}
                </p>
                {item.anulado ? (
                  <StatusBadge estado="ANULADO" />
                ) : (
                  <StatusBadge estado="ACTIVO" />
                )}
              </div>
            </div>
            {(item.referencia || item.proveedor?.nombre || item.motivoAjuste) ? (
              <p className="text-sm text-muted">
                {[item.referencia, item.proveedor?.nombre, item.motivoAjuste]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            ) : null}
            {!item.anulado && canMovimientos ? (
              <Button type="button" variant="outline" onClick={() => setPendingAnular(item)}>
                Anular
              </Button>
            ) : null}
          </article>
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

      {pendingAnular ? (
        <section className="space-y-4 rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-warning/20">
          <h2 className="text-lg font-semibold text-foreground">Anular movimiento</h2>
          <p className="text-sm text-muted">
            {pendingAnular.tipoMovimiento?.nombre} · {pendingAnular.alimento?.nombre} ·{' '}
            {pendingAnular.fecha}
          </p>
          <Field label="Motivo de anulacion" htmlFor="movimiento-motivo-anulacion" required>
            <input
              id="movimiento-motivo-anulacion"
              className={getInputClassName()}
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              placeholder="Ej. Error de carga"
            />
          </Field>
          <div className="flex gap-2">
            <Button
              type="button"
              fullWidth
              disabled={anularMutation.isPending}
              onClick={() => {
                if (!motivoAnulacion.trim()) {
                  toast.error('Debes indicar el motivo de anulacion.');
                  return;
                }
                anularMutation.mutate({ id: pendingAnular.id, motivo: motivoAnulacion.trim() });
              }}
            >
              {anularMutation.isPending ? 'Anulando...' : 'Confirmar anulacion'}
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => {
                setPendingAnular(null);
                setMotivoAnulacion('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
