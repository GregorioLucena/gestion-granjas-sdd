export type HipotesisRecomendacion = {
  codigo: string;
  etiqueta: string;
  score: number;
  motivo: string;
};

export type Recomendacion = {
  id: string;
  companiaId: string;
  granjaId: string;
  loteId?: string | null;
  almacenId?: string | null;
  tipo: 'CONSUMO_DESVIO' | 'STOCK_REPOSICION' | 'EVALUACION_CIERRE';
  ciclo: 'OPERATIVO' | 'TACTICO' | 'ESTRATEGICO';
  severidad: 'INFO' | 'ADVERTENCIA' | 'CRITICA';
  estado:
    | 'PENDIENTE'
    | 'EN_COLA'
    | 'ACEPTADA'
    | 'DESCARTADA'
    | 'ACEPTADA_EN_EVALUACION'
    | 'CERRADA'
    | 'SUPERSEDED';
  titulo: string;
  mensaje: string;
  fuenteMensaje?: 'PLANTILLA' | 'OLLAMA' | 'OPENAI';
  modeloMensaje?: string | null;
  hipotesis: HipotesisRecomendacion[];
  accionSugerida: string;
  evidencia?: Record<string, unknown> | null;
  consumoId?: string | null;
  engordeId?: string | null;
  prioridad: number;
  createdAt: string;
};

export type FeedbackRecomendacion = {
  id: string;
  recomendacionId: string;
  decision: 'ACEPTADA' | 'DESCARTADA';
  motivo?: string | null;
  usuarioId: string;
  createdAt: string;
};

export type FiltroEstadoAsistente = 'PENDIENTE' | 'TODAS' | 'RESUELTAS';

export const SEVERIDAD_LABEL: Record<Recomendacion['severidad'], string> = {
  INFO: 'Informativa',
  ADVERTENCIA: 'Advertencia',
  CRITICA: 'Critica',
};

export const ESTADO_LABEL: Record<Recomendacion['estado'], string> = {
  PENDIENTE: 'Pendiente',
  EN_COLA: 'En cola',
  ACEPTADA: 'Aceptada',
  DESCARTADA: 'Descartada',
  ACEPTADA_EN_EVALUACION: 'En evaluacion',
  CERRADA: 'Cerrada',
  SUPERSEDED: 'Reemplazada',
};

export function severidadClassName(severidad: Recomendacion['severidad']): string {
  switch (severidad) {
    case 'CRITICA':
      return 'bg-danger/10 text-danger ring-danger/25';
    case 'ADVERTENCIA':
      return 'bg-warning/15 text-warning ring-warning/30';
    default:
      return 'bg-info/10 text-info ring-info/25';
  }
}

export function formatEvidenciaDesvio(evidencia?: Record<string, unknown> | null): string[] {
  if (!evidencia) return [];
  const lines: string[] = [];
  if (typeof evidencia.desvioPct === 'number') {
    lines.push(`Desvio: ${evidencia.desvioPct}% sobre el promedio`);
  }
  if (typeof evidencia.promedioHistorico === 'number') {
    lines.push(`Promedio historico: ${evidencia.promedioHistorico} kg`);
  }
  if (typeof evidencia.cantidadActual === 'number') {
    lines.push(`Consumo registrado: ${evidencia.cantidadActual} kg`);
  }
  if (typeof evidencia.registrosHistoricos === 'number') {
    lines.push(`Registros en ventana: ${evidencia.registrosHistoricos}`);
  }
  if (typeof evidencia.ventanaDias === 'number') {
    lines.push(`Ventana: ${evidencia.ventanaDias} dias`);
  }
  return lines;
}
