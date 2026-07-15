'use client';

import { EmptyState } from '@/components/data-display/empty-state';
import { coberturaTone } from '@/modules/reportes/format';

export function GranjaRequiredState() {
  return (
    <EmptyState
      title="Selecciona una granja activa"
      description="Los reportes de alimentacion requieren una granja seleccionada."
    />
  );
}

export function ReportLoadingState() {
  return (
    <p className="rounded-2xl bg-surface/95 px-4 py-6 text-sm text-muted ring-1 ring-primary/10">
      Cargando reporte…
    </p>
  );
}

export function ReportErrorState({ message }: { message: string }) {
  return (
    <p className="rounded-2xl bg-danger/10 px-4 py-6 text-sm text-danger ring-1 ring-danger/20">
      {message}
    </p>
  );
}

export function CoberturaBadge({ etiqueta }: { etiqueta: string }) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset ${coberturaTone(etiqueta)}`}
    >
      {etiqueta}
    </span>
  );
}
