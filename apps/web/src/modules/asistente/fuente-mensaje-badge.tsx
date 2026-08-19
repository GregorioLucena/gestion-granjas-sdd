import type { Recomendacion } from './types';

type FuenteMensajeBadgeProps = {
  fuente?: Recomendacion['fuenteMensaje'];
  modelo?: string | null;
};

const FUENTE_LABEL: Record<NonNullable<Recomendacion['fuenteMensaje']>, string> = {
  PLANTILLA: 'Reglas del sistema',
  OLLAMA: 'Modelo local',
  OPENAI: 'Modelo en la nube',
};

export function FuenteMensajeBadge({ fuente, modelo }: FuenteMensajeBadgeProps) {
  const origen = fuente ?? 'PLANTILLA';
  const etiqueta = modelo?.trim()
    ? `${FUENTE_LABEL[origen]} · ${modelo.trim()}`
    : FUENTE_LABEL[origen];

  return (
    <span className="inline-flex min-h-6 max-w-full items-center rounded-full bg-mist px-2.5 text-[11px] font-semibold text-muted ring-1 ring-primary/15">
      {etiqueta}
    </span>
  );
}
