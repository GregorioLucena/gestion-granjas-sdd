'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PERMISOS, hasPermission } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/data-display/empty-state';
import { PaginationBar } from '@/components/data-display/pagination-bar';
import { StatusBadge } from '@/components/data-display/status-badge';
import { useToast } from '@/components/feedback/toast';
import { Field, FormRequiredLegend, getInputClassName } from '@/components/forms/field';
import {
  FormActions,
  FormHeader,
  formPanelWarningClassName,
  formShellClassName,
} from '@/components/forms/form-shell';
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
  fechaInicio: string;
  cantidadInicial: number;
  finalidadProductiva?: { id: string; nombre: string; codigoSistema?: string | null };
};

type Motivo = { id: string; nombre: string };
type MetodoPesaje = { id: string; nombre: string };

type EngordeListItem = {
  id: string;
  fechaInicio: string;
  cantidadInicial: number;
  cantidadActual: number;
  estado: 'EN_CURSO' | 'CERRADO' | 'ANULADO';
  objetivoPesoKg?: string | null;
  lote?: Lote;
};

type Baja = {
  id: string;
  fecha: string;
  cantidad: number;
  anulado: boolean;
  motivo?: Motivo;
};

type Cierre = {
  id: string;
  fechaCierre: string;
  cantidadFinal: number;
  anulado: boolean;
  motivoCierre?: Motivo;
};

type EngordeResumen = EngordeListItem & {
  bajas: Baja[];
  cierres: Cierre[];
  pesoInicialPromedioKg?: number | null;
  pesoFinalPromedioKg?: number | null;
  ultimoPesoPromedioKg?: number | null;
  gananciaPromedioKg?: number | null;
  consumoPeriodo?: { total: number };
};

type AnularPending =
  | { type: 'proceso'; engordeId: string }
  | { type: 'baja'; engordeId: string; bajaId: string }
  | { type: 'cierre'; engordeId: string; cierreId: string };

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function EngordePage() {
  const { user } = useAuth();
  const ctx = user ? tenantContextFromUser(user) : null;

  return (
    <PermissionGuard permission={PERMISOS.ENGORDE_VER}>
      <EngordeContent
        granjaActivaId={user?.granjaActivaId ?? ''}
        canIniciar={ctx ? hasPermission(ctx, PERMISOS.ENGORDE_INICIAR) : false}
        canBaja={ctx ? hasPermission(ctx, PERMISOS.ENGORDE_BAJAS_CREAR) : false}
        canCerrar={ctx ? hasPermission(ctx, PERMISOS.ENGORDE_CERRAR) : false}
        canAnular={ctx ? hasPermission(ctx, PERMISOS.ENGORDE_ANULAR) : false}
      />
    </PermissionGuard>
  );
}

function EngordeContent({
  granjaActivaId,
  canIniciar,
  canBaja,
  canCerrar,
  canAnular,
}: {
  granjaActivaId: string;
  canIniciar: boolean;
  canBaja: boolean;
  canCerrar: boolean;
  canAnular: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'EN_CURSO' | 'CERRADO'>('TODOS');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showInicio, setShowInicio] = useState(false);
  const [showBaja, setShowBaja] = useState(false);
  const [showCierre, setShowCierre] = useState(false);
  const [pendingAnular, setPendingAnular] = useState<AnularPending | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const [loteId, setLoteId] = useState('');
  const [fechaInicio, setFechaInicio] = useState(todayIsoDate());
  const [pesoInicial, setPesoInicial] = useState('');
  const [modalidadInicial, setModalidadInicial] = useState('PROMEDIO_LOTE');
  const [metodoInicialId, setMetodoInicialId] = useState('');
  const [muestraInicial, setMuestraInicial] = useState('');
  const [objetivoPeso, setObjetivoPeso] = useState('');
  const [obsInicio, setObsInicio] = useState('');
  const [inicioErrors, setInicioErrors] = useState<FieldErrors>({});

  const [bajaFecha, setBajaFecha] = useState(todayIsoDate());
  const [bajaCantidad, setBajaCantidad] = useState('');
  const [bajaMotivoId, setBajaMotivoId] = useState('');
  const [bajaObs, setBajaObs] = useState('');
  const [bajaErrors, setBajaErrors] = useState<FieldErrors>({});

  const [cierreFecha, setCierreFecha] = useState(todayIsoDate());
  const [cierreCantidad, setCierreCantidad] = useState('');
  const [cierreMotivoId, setCierreMotivoId] = useState('');
  const [pesoFinal, setPesoFinal] = useState('');
  const [modalidadFinal, setModalidadFinal] = useState('PROMEDIO_LOTE');
  const [metodoFinalId, setMetodoFinalId] = useState('');
  const [muestraFinal, setMuestraFinal] = useState('');
  const [cierreObs, setCierreObs] = useState('');
  const [cierreErrors, setCierreErrors] = useState<FieldErrors>({});

  const { items, meta, page, setPage, isLoading, isError } = usePaginatedList<EngordeListItem>({
    queryKey: ['engordes', granjaActivaId, filtroEstado],
    apiPath: '/engordes',
    extraParams: {
      ...(granjaActivaId ? { granjaId: granjaActivaId } : {}),
      ...(filtroEstado !== 'TODOS' ? { estado: filtroEstado } : {}),
    },
    enabled: !!granjaActivaId,
    estadoParam: 'estadoRegistro',
  });

  const { data: resumen, isLoading: resumenLoading } = useQuery({
    queryKey: ['engorde-resumen', selectedId],
    enabled: !!selectedId,
    queryFn: () => apiFetch<EngordeResumen>(`/engordes/${selectedId}`),
  });

  const { data: lotesData } = useQuery({
    queryKey: ['lotes', 'engorde-select', granjaActivaId],
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

  const { data: engordesVigentesData } = useQuery({
    queryKey: ['engordes', 'vigentes', granjaActivaId],
    enabled: !!granjaActivaId,
    queryFn: () =>
      apiFetchPaginated<EngordeListItem>('/engordes', {
        page: 1,
        limit: 100,
        granjaId: granjaActivaId,
      }),
  });

  const { data: motivosBajaData } = useQuery({
    queryKey: ['motivos-baja-engorde', 'activos'],
    queryFn: () =>
      apiFetchPaginated<Motivo>('/motivos-baja-engorde', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const { data: motivosCierreData } = useQuery({
    queryKey: ['motivos-cierre-engorde', 'activos'],
    queryFn: () =>
      apiFetchPaginated<Motivo>('/motivos-cierre-engorde', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const { data: metodosData } = useQuery({
    queryKey: ['metodos-pesaje', 'activos'],
    queryFn: () =>
      apiFetchPaginated<MetodoPesaje>('/metodos-pesaje', {
        page: 1,
        limit: 100,
        estadoRegistro: 'ACTIVO',
      }),
  });

  const lotesElegibles = useMemo(() => {
    const occupied = new Set(
      (engordesVigentesData?.items ?? []).map((item) => item.lote?.id).filter(Boolean),
    );
    return (lotesData?.items ?? []).filter(
      (lote) =>
        lote.finalidadProductiva?.codigoSistema === 'ENGORDE' && !occupied.has(lote.id),
    );
  }, [engordesVigentesData?.items, lotesData?.items]);

  const motivosBaja = motivosBajaData?.items ?? [];
  const motivosCierre = motivosCierreData?.items ?? [];
  const metodos = metodosData?.items ?? [];

  useEffect(() => {
    if (!selectedId && items[0]) setSelectedId(items[0].id);
  }, [items, selectedId]);

  function invalidateAll() {
    void queryClient.invalidateQueries({ queryKey: ['engordes'] });
    void queryClient.invalidateQueries({ queryKey: ['engorde-resumen'] });
    void queryClient.invalidateQueries({ queryKey: ['lotes'] });
  }

  const iniciarMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<EngordeResumen>('/engordes', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (data) => {
      toast.success('Engorde iniciado.');
      invalidateAll();
      setShowInicio(false);
      setSelectedId(data.id);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo iniciar el engorde.')),
  });

  const bajaMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch(`/engordes/${id}/bajas`, { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success('Baja registrada.');
      invalidateAll();
      setShowBaja(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo registrar la baja.')),
  });

  const cerrarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch(`/engordes/${id}/cerrar`, { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success('Engorde cerrado.');
      invalidateAll();
      setShowCierre(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo cerrar el engorde.')),
  });

  const anularMutation = useMutation({
    mutationFn: async ({ pending, motivo }: { pending: AnularPending; motivo: string }) => {
      if (pending.type === 'proceso') {
        return apiFetch(`/engordes/${pending.engordeId}/anular`, {
          method: 'POST',
          body: JSON.stringify({ motivo }),
        });
      }
      if (pending.type === 'baja') {
        return apiFetch(`/engordes/${pending.engordeId}/bajas/${pending.bajaId}/anular`, {
          method: 'POST',
          body: JSON.stringify({ motivo }),
        });
      }
      return apiFetch(`/engordes/${pending.engordeId}/cierres/${pending.cierreId}/anular`, {
        method: 'POST',
        body: JSON.stringify({ motivo }),
      });
    },
    onSuccess: () => {
      toast.success('Anulacion registrada.');
      invalidateAll();
      setPendingAnular(null);
      setMotivoAnulacion('');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo anular.')),
  });

  function openInicio() {
    setShowInicio(true);
    setLoteId(lotesElegibles[0]?.id ?? '');
    setFechaInicio(todayIsoDate());
    setPesoInicial('');
    setModalidadInicial('PROMEDIO_LOTE');
    setMetodoInicialId(metodos[0]?.id ?? '');
    setMuestraInicial('');
    setObjetivoPeso('');
    setObsInicio('');
    setInicioErrors({});
  }

  function handleInicio(event: FormEvent) {
    event.preventDefault();
    const errors: FieldErrors = {};
    if (!loteId) errors.loteId = REQUIRED_FIELD_MESSAGE;
    if (!fechaInicio) errors.fechaInicio = REQUIRED_FIELD_MESSAGE;
    if (pesoInicial) {
      if (!metodoInicialId) errors.metodoInicialId = REQUIRED_FIELD_MESSAGE;
      if (modalidadInicial === 'MUESTRA' && !muestraInicial) {
        errors.muestraInicial = REQUIRED_FIELD_MESSAGE;
      }
    }
    if (Object.keys(errors).length > 0) {
      setInicioErrors(errors);
      return;
    }
    iniciarMutation.mutate({
      granjaId: granjaActivaId,
      loteId,
      fechaInicio,
      ...(pesoInicial
        ? {
            pesoInicialPromedioKg: Number(pesoInicial),
            modalidadPesoInicial: modalidadInicial,
            metodoPesajeInicialId: metodoInicialId,
            ...(modalidadInicial === 'MUESTRA'
              ? { cantidadMuestraInicial: Number(muestraInicial) }
              : {}),
          }
        : {}),
      ...(objetivoPeso ? { objetivoPesoKg: Number(objetivoPeso) } : {}),
      observaciones: obsInicio.trim() || undefined,
    });
  }

  function openBaja() {
    setShowBaja(true);
    setBajaFecha(todayIsoDate());
    setBajaCantidad('');
    setBajaMotivoId(motivosBaja[0]?.id ?? '');
    setBajaObs('');
    setBajaErrors({});
  }

  function handleBaja(event: FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    const errors: FieldErrors = {};
    if (!bajaFecha) errors.bajaFecha = REQUIRED_FIELD_MESSAGE;
    if (!bajaCantidad || Number(bajaCantidad) <= 0) errors.bajaCantidad = 'Debe ser mayor que cero.';
    if (!bajaMotivoId) errors.bajaMotivoId = REQUIRED_FIELD_MESSAGE;
    if (Object.keys(errors).length > 0) {
      setBajaErrors(errors);
      return;
    }
    bajaMutation.mutate({
      id: selectedId,
      payload: {
        fecha: bajaFecha,
        cantidad: Number(bajaCantidad),
        motivoId: bajaMotivoId,
        observaciones: bajaObs.trim() || undefined,
      },
    });
  }

  function openCierre() {
    setShowCierre(true);
    setCierreFecha(todayIsoDate());
    setCierreCantidad(String(resumen?.cantidadActual ?? ''));
    setCierreMotivoId(motivosCierre[0]?.id ?? '');
    setPesoFinal('');
    setModalidadFinal('PROMEDIO_LOTE');
    setMetodoFinalId(metodos[0]?.id ?? '');
    setMuestraFinal('');
    setCierreObs('');
    setCierreErrors({});
  }

  function handleCierre(event: FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    const errors: FieldErrors = {};
    if (!cierreFecha) errors.cierreFecha = REQUIRED_FIELD_MESSAGE;
    if (cierreCantidad === '') errors.cierreCantidad = REQUIRED_FIELD_MESSAGE;
    if (!cierreMotivoId) errors.cierreMotivoId = REQUIRED_FIELD_MESSAGE;
    if (pesoFinal) {
      if (!metodoFinalId) errors.metodoFinalId = REQUIRED_FIELD_MESSAGE;
      if (modalidadFinal === 'MUESTRA' && !muestraFinal) {
        errors.muestraFinal = REQUIRED_FIELD_MESSAGE;
      }
    }
    if (Object.keys(errors).length > 0) {
      setCierreErrors(errors);
      return;
    }
    cerrarMutation.mutate({
      id: selectedId,
      payload: {
        fechaCierre: cierreFecha,
        cantidadFinal: Number(cierreCantidad),
        motivoCierreId: cierreMotivoId,
        ...(pesoFinal
          ? {
              pesoFinalPromedioKg: Number(pesoFinal),
              modalidadPesoFinal: modalidadFinal,
              metodoPesajeFinalId: metodoFinalId,
              ...(modalidadFinal === 'MUESTRA'
                ? { cantidadMuestraFinal: Number(muestraFinal) }
                : {}),
            }
          : {}),
        observaciones: cierreObs.trim() || undefined,
      },
    });
  }

  if (!granjaActivaId) {
    return (
      <div className="space-y-5 pb-24">
        <PageHeader
          backHref="/dashboard"
          backLabel="Inicio"
          title="Engorde"
          description="Inicie, controle bajas y cierre ciclos de engorde por lote."
        />
        <EmptyState
          title="Seleccione una granja"
          description="Elija la granja activa para ver y gestionar engordes."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/dashboard"
        backLabel="Inicio"
        title="Engorde"
        description="Inicie, controle bajas y cierre ciclos de engorde por lote."
      />

      <div className="flex flex-wrap gap-2">
        {(['TODOS', 'EN_CURSO', 'CERRADO'] as const).map((estado) => (
          <Button
            key={estado}
            type="button"
            variant={filtroEstado === estado ? 'primary' : 'outline'}
            onClick={() => {
              setFiltroEstado(estado);
              setPage(1);
            }}
          >
            {estado === 'TODOS' ? 'Todos' : estado === 'EN_CURSO' ? 'En curso' : 'Cerrados'}
          </Button>
        ))}
        {canIniciar ? (
          <Button type="button" onClick={openInicio}>
            Iniciar engorde
          </Button>
        ) : null}
      </div>

      {showInicio ? (
        <form className={formShellClassName} onSubmit={handleInicio}>
          <FormHeader
            title="Iniciar engorde"
            description="Solo lotes activos con finalidad Engorde."
          />
          <FormRequiredLegend />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Lote" htmlFor="loteId" required error={inicioErrors.loteId}>
              <select
                id="loteId"
                className={getInputClassName(!!inicioErrors.loteId)}
                value={loteId}
                onChange={(e) => {
                  setLoteId(e.target.value);
                  clearFieldError('loteId', setInicioErrors);
                }}
              >
                <option value="">Seleccione</option>
                {lotesElegibles.map((lote) => (
                  <option key={lote.id} value={lote.id}>
                    {lote.codigo} ({lote.cantidadInicial} animales)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha de inicio" htmlFor="fechaInicio" required error={inicioErrors.fechaInicio}>
              <input
                id="fechaInicio"
                type="date"
                className={getInputClassName(!!inicioErrors.fechaInicio)}
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </Field>
            <Field label="Peso inicial promedio (kg)" htmlFor="pesoInicial">
              <input
                id="pesoInicial"
                type="number"
                step="0.001"
                min="0"
                className={getInputClassName()}
                value={pesoInicial}
                onChange={(e) => setPesoInicial(e.target.value)}
              />
            </Field>
            <Field label="Objetivo de peso (kg)" htmlFor="objetivoPeso">
              <input
                id="objetivoPeso"
                type="number"
                step="0.001"
                min="0"
                className={getInputClassName()}
                value={objetivoPeso}
                onChange={(e) => setObjetivoPeso(e.target.value)}
              />
            </Field>
            {pesoInicial ? (
              <>
                <Field label="Modalidad" htmlFor="modalidadInicial" required>
                  <select
                    id="modalidadInicial"
                    className={getInputClassName()}
                    value={modalidadInicial}
                    onChange={(e) => setModalidadInicial(e.target.value)}
                  >
                    <option value="PROMEDIO_LOTE">Promedio de lote</option>
                    <option value="MUESTRA">Muestra</option>
                  </select>
                </Field>
                <Field
                  label="Metodo de pesaje"
                  htmlFor="metodoInicialId"
                  required
                  error={inicioErrors.metodoInicialId}
                >
                  <select
                    id="metodoInicialId"
                    className={getInputClassName(!!inicioErrors.metodoInicialId)}
                    value={metodoInicialId}
                    onChange={(e) => setMetodoInicialId(e.target.value)}
                  >
                    <option value="">Seleccione</option>
                    {metodos.map((metodo) => (
                      <option key={metodo.id} value={metodo.id}>
                        {metodo.nombre}
                      </option>
                    ))}
                  </select>
                </Field>
                {modalidadInicial === 'MUESTRA' ? (
                  <Field
                    label="Cantidad de muestra"
                    htmlFor="muestraInicial"
                    required
                    error={inicioErrors.muestraInicial}
                  >
                    <input
                      id="muestraInicial"
                      type="number"
                      min="1"
                      className={getInputClassName(!!inicioErrors.muestraInicial)}
                      value={muestraInicial}
                      onChange={(e) => setMuestraInicial(e.target.value)}
                    />
                  </Field>
                ) : null}
              </>
            ) : null}
            <Field label="Observaciones" htmlFor="obsInicio">
              <textarea
                id="obsInicio"
                className={getInputClassName()}
                rows={2}
                value={obsInicio}
                onChange={(e) => setObsInicio(e.target.value)}
              />
            </Field>
          </div>
          <FormActions
            submitLabel="Iniciar"
            onCancel={() => setShowInicio(false)}
            loading={iniciarMutation.isPending}
          />
        </form>
      ) : null}

      {isError ? (
        <p className="text-sm text-danger">No se pudieron cargar los engordes.</p>
      ) : null}
      {isLoading ? <p className="text-sm text-muted">Cargando engordes...</p> : null}
      {!isLoading && items.length === 0 ? (
        <EmptyState
          title="Aun no hay engordes"
          description="Inicie el proceso en un lote elegible de esta granja."
          action={
            canIniciar ? (
              <Button type="button" onClick={openInicio}>
                Crear primer engorde
              </Button>
            ) : undefined
          }
        />
      ) : null}

      <div className="grid gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              selectedId === item.id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.lote?.codigo ?? 'Lote'}</p>
                <p className="mt-1 text-sm text-muted">
                  Inicio {item.fechaInicio} · Actual {item.cantidadActual}/{item.cantidadInicial}
                </p>
              </div>
              <StatusBadge estado={item.estado} />
            </div>
          </button>
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

      {selectedId && resumen ? (
        <section className="space-y-4 rounded-3xl border border-primary/10 bg-surface/95 p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">
                Resumen · {resumen.lote?.codigo}
              </h2>
              <p className="text-sm text-muted">
                Cantidad actual {resumen.cantidadActual} · Consumo periodo{' '}
                {resumen.consumoPeriodo?.total ?? 0} kg
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {resumen.estado === 'EN_CURSO' && canBaja ? (
                <Button type="button" variant="outline" onClick={openBaja}>
                  Registrar baja
                </Button>
              ) : null}
              {resumen.estado === 'EN_CURSO' && canCerrar ? (
                <Button type="button" onClick={openCierre}>
                  Cerrar engorde
                </Button>
              ) : null}
              {resumen.estado === 'EN_CURSO' && canAnular ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPendingAnular({ type: 'proceso', engordeId: resumen.id })}
                >
                  Anular proceso
                </Button>
              ) : null}
              <Link
                href={`/pesos?loteId=${resumen.lote?.id ?? ''}&engordeId=${resumen.id}`}
                className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-primary ring-1 ring-primary/15"
              >
                Ver pesos
              </Link>
            </div>
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>Peso inicial: {resumen.pesoInicialPromedioKg ?? '—'} kg</p>
            <p>Ultimo peso: {resumen.ultimoPesoPromedioKg ?? '—'} kg</p>
            <p>Peso final: {resumen.pesoFinalPromedioKg ?? '—'} kg</p>
            <p>Ganancia: {resumen.gananciaPromedioKg ?? '—'} kg</p>
            <p>Objetivo: {resumen.objetivoPesoKg ?? '—'} kg</p>
          </div>

          {showBaja ? (
            <form className={formShellClassName} onSubmit={handleBaja}>
              <FormHeader title="Registrar baja" />
              <FormRequiredLegend />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Fecha" htmlFor="bajaFecha" required error={bajaErrors.bajaFecha}>
                  <input
                    id="bajaFecha"
                    type="date"
                    className={getInputClassName(!!bajaErrors.bajaFecha)}
                    value={bajaFecha}
                    onChange={(e) => setBajaFecha(e.target.value)}
                  />
                </Field>
                <Field label="Cantidad" htmlFor="bajaCantidad" required error={bajaErrors.bajaCantidad}>
                  <input
                    id="bajaCantidad"
                    type="number"
                    min="1"
                    className={getInputClassName(!!bajaErrors.bajaCantidad)}
                    value={bajaCantidad}
                    onChange={(e) => setBajaCantidad(e.target.value)}
                  />
                </Field>
                <Field label="Motivo" htmlFor="bajaMotivoId" required error={bajaErrors.bajaMotivoId}>
                  <select
                    id="bajaMotivoId"
                    className={getInputClassName(!!bajaErrors.bajaMotivoId)}
                    value={bajaMotivoId}
                    onChange={(e) => setBajaMotivoId(e.target.value)}
                  >
                    <option value="">Seleccione</option>
                    {motivosBaja.map((motivo) => (
                      <option key={motivo.id} value={motivo.id}>
                        {motivo.nombre}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Observaciones" htmlFor="bajaObs">
                  <input
                    id="bajaObs"
                    className={getInputClassName()}
                    value={bajaObs}
                    onChange={(e) => setBajaObs(e.target.value)}
                  />
                </Field>
              </div>
              <FormActions
                submitLabel="Registrar baja"
                onCancel={() => setShowBaja(false)}
                loading={bajaMutation.isPending}
              />
            </form>
          ) : null}

          {showCierre ? (
            <form className={formShellClassName} onSubmit={handleCierre}>
              <FormHeader title="Cerrar engorde" />
              <FormRequiredLegend />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Fecha de cierre" htmlFor="cierreFecha" required error={cierreErrors.cierreFecha}>
                  <input
                    id="cierreFecha"
                    type="date"
                    className={getInputClassName(!!cierreErrors.cierreFecha)}
                    value={cierreFecha}
                    onChange={(e) => setCierreFecha(e.target.value)}
                  />
                </Field>
                <Field
                  label="Cantidad final"
                  htmlFor="cierreCantidad"
                  required
                  error={cierreErrors.cierreCantidad}
                >
                  <input
                    id="cierreCantidad"
                    type="number"
                    min="0"
                    className={getInputClassName(!!cierreErrors.cierreCantidad)}
                    value={cierreCantidad}
                    onChange={(e) => setCierreCantidad(e.target.value)}
                  />
                </Field>
                <Field
                  label="Motivo de cierre"
                  htmlFor="cierreMotivoId"
                  required
                  error={cierreErrors.cierreMotivoId}
                >
                  <select
                    id="cierreMotivoId"
                    className={getInputClassName(!!cierreErrors.cierreMotivoId)}
                    value={cierreMotivoId}
                    onChange={(e) => setCierreMotivoId(e.target.value)}
                  >
                    <option value="">Seleccione</option>
                    {motivosCierre.map((motivo) => (
                      <option key={motivo.id} value={motivo.id}>
                        {motivo.nombre}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Peso final promedio (kg)" htmlFor="pesoFinal">
                  <input
                    id="pesoFinal"
                    type="number"
                    step="0.001"
                    min="0"
                    className={getInputClassName()}
                    value={pesoFinal}
                    onChange={(e) => setPesoFinal(e.target.value)}
                  />
                </Field>
                {pesoFinal ? (
                  <>
                    <Field label="Modalidad" htmlFor="modalidadFinal" required>
                      <select
                        id="modalidadFinal"
                        className={getInputClassName()}
                        value={modalidadFinal}
                        onChange={(e) => setModalidadFinal(e.target.value)}
                      >
                        <option value="PROMEDIO_LOTE">Promedio de lote</option>
                        <option value="MUESTRA">Muestra</option>
                      </select>
                    </Field>
                    <Field
                      label="Metodo de pesaje"
                      htmlFor="metodoFinalId"
                      required
                      error={cierreErrors.metodoFinalId}
                    >
                      <select
                        id="metodoFinalId"
                        className={getInputClassName(!!cierreErrors.metodoFinalId)}
                        value={metodoFinalId}
                        onChange={(e) => setMetodoFinalId(e.target.value)}
                      >
                        <option value="">Seleccione</option>
                        {metodos.map((metodo) => (
                          <option key={metodo.id} value={metodo.id}>
                            {metodo.nombre}
                          </option>
                        ))}
                      </select>
                    </Field>
                    {modalidadFinal === 'MUESTRA' ? (
                      <Field
                        label="Cantidad de muestra"
                        htmlFor="muestraFinal"
                        required
                        error={cierreErrors.muestraFinal}
                      >
                        <input
                          id="muestraFinal"
                          type="number"
                          min="1"
                          className={getInputClassName(!!cierreErrors.muestraFinal)}
                          value={muestraFinal}
                          onChange={(e) => setMuestraFinal(e.target.value)}
                        />
                      </Field>
                    ) : null}
                  </>
                ) : null}
                <Field label="Observaciones" htmlFor="cierreObs">
                  <textarea
                    id="cierreObs"
                    className={getInputClassName()}
                    rows={2}
                    value={cierreObs}
                    onChange={(e) => setCierreObs(e.target.value)}
                  />
                </Field>
              </div>
              <FormActions
                submitLabel="Cerrar"
                onCancel={() => setShowCierre(false)}
                loading={cerrarMutation.isPending}
              />
            </form>
          ) : null}

          <div>
            <h3 className="mb-2 text-sm font-semibold">Bajas</h3>
            {resumen.bajas.length === 0 ? (
              <p className="text-sm text-muted">Sin bajas registradas.</p>
            ) : (
              <ul className="space-y-2">
                {resumen.bajas.map((baja) => (
                  <li
                    key={baja.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/10 px-3 py-2 text-sm"
                  >
                    <span>
                      {baja.fecha} · {baja.cantidad} · {baja.motivo?.nombre ?? 'Motivo'}{' '}
                      {baja.anulado ? '(anulada)' : ''}
                    </span>
                    {!baja.anulado && canAnular && resumen.estado === 'EN_CURSO' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setPendingAnular({
                            type: 'baja',
                            engordeId: resumen.id,
                            bajaId: baja.id,
                          })
                        }
                      >
                        Anular
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Cierres</h3>
            {resumen.cierres.length === 0 ? (
              <p className="text-sm text-muted">Sin cierres.</p>
            ) : (
              <ul className="space-y-2">
                {resumen.cierres.map((cierre) => (
                  <li
                    key={cierre.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/10 px-3 py-2 text-sm"
                  >
                    <span>
                      {cierre.fechaCierre} · final {cierre.cantidadFinal} ·{' '}
                      {cierre.motivoCierre?.nombre ?? 'Motivo'}{' '}
                      {cierre.anulado ? '(anulado)' : '(vigente)'}
                    </span>
                    {!cierre.anulado && canAnular ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setPendingAnular({
                            type: 'cierre',
                            engordeId: resumen.id,
                            cierreId: cierre.id,
                          })
                        }
                      >
                        Anular cierre
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : selectedId && resumenLoading ? (
        <p className="text-sm text-muted">Cargando resumen...</p>
      ) : null}

      {pendingAnular ? (
        <section className={formPanelWarningClassName}>
          <FormHeader
            title="Confirmar anulacion"
            description="Indique el motivo. La operacion queda en el historial."
          />
          <Field label="Motivo" htmlFor="motivoAnulacion" required>
            <textarea
              id="motivoAnulacion"
              className={getInputClassName()}
              rows={3}
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Button
              type="button"
              fullWidth
              variant="outline"
              onClick={() => {
                setPendingAnular(null);
                setMotivoAnulacion('');
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              fullWidth
              disabled={anularMutation.isPending}
              onClick={() => {
                if (motivoAnulacion.trim().length < 3) {
                  toast.error('Indique un motivo de al menos 3 caracteres.');
                  return;
                }
                anularMutation.mutate({
                  pending: pendingAnular,
                  motivo: motivoAnulacion.trim(),
                });
              }}
            >
              {anularMutation.isPending ? 'Anulando...' : 'Anular'}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
