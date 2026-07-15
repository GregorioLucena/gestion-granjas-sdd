'use client';

import Link from 'next/link';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Field, getInputClassName } from '@/components/forms/field';
import { Button } from '@/components/ui/button';

export type ReportFilters = {
  fechaDesde: string;
  fechaHasta: string;
  loteId: string;
  alimentoId: string;
  almacenId: string;
};

type Option = { id: string; label: string };

type ReportFiltersPanelProps = {
  title: string;
  description: string;
  showPeriodo?: boolean;
  applied: ReportFilters;
  lotes?: Option[];
  alimentos?: Option[];
  almacenes?: Option[];
  onApply: (filters: ReportFilters) => void;
  children?: ReactNode;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function defaultReportFilters(): ReportFilters {
  return {
    fechaDesde: daysAgoIso(30),
    fechaHasta: todayIsoDate(),
    loteId: '',
    alimentoId: '',
    almacenId: '',
  };
}

export function ReportFiltersPanel({
  title,
  description,
  showPeriodo = true,
  applied,
  lotes = [],
  alimentos = [],
  almacenes = [],
  onApply,
  children,
}: ReportFiltersPanelProps) {
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState(applied);

  useEffect(() => {
    setDraft(applied);
  }, [applied]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onApply(draft);
  }

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/reportes/alimentacion"
        backLabel="Reportes"
        title={title}
        description={description}
      />

      <section className="rounded-3xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Filtros</p>
            <p className="text-xs text-muted">
              {showPeriodo
                ? `${applied.fechaDesde} → ${applied.fechaHasta}`
                : 'Existencia actual'}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => setOpen((value) => !value)}>
            {open ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>

        {open ? (
          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
            {showPeriodo ? (
              <>
                <Field label="Desde" htmlFor="fechaDesde" required>
                  <input
                    id="fechaDesde"
                    type="date"
                    className={getInputClassName()}
                    value={draft.fechaDesde}
                    onChange={(e) => setDraft((prev) => ({ ...prev, fechaDesde: e.target.value }))}
                  />
                </Field>
                <Field label="Hasta" htmlFor="fechaHasta" required>
                  <input
                    id="fechaHasta"
                    type="date"
                    className={getInputClassName()}
                    value={draft.fechaHasta}
                    onChange={(e) => setDraft((prev) => ({ ...prev, fechaHasta: e.target.value }))}
                  />
                </Field>
              </>
            ) : null}
            {lotes.length > 0 ? (
              <Field label="Lote" htmlFor="loteId">
                <select
                  id="loteId"
                  className={getInputClassName()}
                  value={draft.loteId}
                  onChange={(e) => setDraft((prev) => ({ ...prev, loteId: e.target.value }))}
                >
                  <option value="">Todos</option>
                  {lotes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            {alimentos.length > 0 ? (
              <Field label="Alimento" htmlFor="alimentoId">
                <select
                  id="alimentoId"
                  className={getInputClassName()}
                  value={draft.alimentoId}
                  onChange={(e) => setDraft((prev) => ({ ...prev, alimentoId: e.target.value }))}
                >
                  <option value="">Todos</option>
                  {alimentos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            {almacenes.length > 0 ? (
              <Field label="Almacen" htmlFor="almacenId">
                <select
                  id="almacenId"
                  className={getInputClassName()}
                  value={draft.almacenId}
                  onChange={(e) => setDraft((prev) => ({ ...prev, almacenId: e.target.value }))}
                >
                  <option value="">Todos</option>
                  {almacenes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <div className="sm:col-span-2">
              <Button type="submit" fullWidth>
                Aplicar filtros
              </Button>
            </div>
          </form>
        ) : null}
      </section>

      {children}

      <Link
        href="/reportes/alimentacion"
        className="inline-flex text-sm font-semibold text-primary"
      >
        Volver al hub de reportes
      </Link>
    </div>
  );
}

export function SummaryCards({
  items,
}: {
  items: Array<{ label: string; value: string; hint?: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{item.label}</p>
          <p className="mt-1 font-display text-2xl font-semibold">{item.value}</p>
          {item.hint ? <p className="mt-1 text-xs text-muted">{item.hint}</p> : null}
        </article>
      ))}
    </div>
  );
}
