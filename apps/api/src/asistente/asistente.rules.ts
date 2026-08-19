import type { HipotesisRecomendacion } from '@gestion-granjas/database/entities';
import { SeveridadRecomendacion } from '@gestion-granjas/database/enums';

/**
 * Umbrales por defecto del asistente (v1 sin configuracion por granja).
 * Ver docs/specs/018-asistente-recomendaciones.md.
 */
export const UMBRALES_DEFAULT = {
  consumoDesvioPct: 15,
  consumoDesvioCriticoPct: 35,
  ventanaDiasHistorico: 30,
  minRegistrosHistoricos: 3,
} as const;

export type ConsumoHistorico = {
  cantidad: number;
  alimentoId: string;
};

export type AnalisisConsumoInput = {
  cantidadActual: number;
  alimentoActualId: string;
  historico: ConsumoHistorico[];
  bajasRecientes: number;
};

export type AnalisisConsumoResultado = {
  hayDesvio: boolean;
  promedioHistorico: number;
  desvioPct: number;
  severidad: SeveridadRecomendacion;
  hipotesis: HipotesisRecomendacion[];
};

function redondear(valor: number, decimales = 2): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

/**
 * Analiza si un consumo se desvia del promedio historico del lote y, de ser asi,
 * genera hipotesis de causa ordenadas por score descendente.
 *
 * Funcion pura: no accede a base de datos ni a contexto de request.
 */
export function analizarDesvioConsumo(
  input: AnalisisConsumoInput,
): AnalisisConsumoResultado {
  const { cantidadActual, alimentoActualId, historico, bajasRecientes } = input;

  const sinDesvio: AnalisisConsumoResultado = {
    hayDesvio: false,
    promedioHistorico: 0,
    desvioPct: 0,
    severidad: SeveridadRecomendacion.INFO,
    hipotesis: [],
  };

  if (historico.length < UMBRALES_DEFAULT.minRegistrosHistoricos) {
    return sinDesvio;
  }

  const promedio =
    historico.reduce((sum, item) => sum + item.cantidad, 0) / historico.length;

  if (promedio <= 0) {
    return sinDesvio;
  }

  const desvioPct = ((cantidadActual - promedio) / promedio) * 100;

  if (desvioPct < UMBRALES_DEFAULT.consumoDesvioPct) {
    return {
      ...sinDesvio,
      promedioHistorico: redondear(promedio),
      desvioPct: redondear(desvioPct),
    };
  }

  const esCritico = desvioPct >= UMBRALES_DEFAULT.consumoDesvioCriticoPct;

  const alimentoCambio = historico.every(
    (item) => item.alimentoId !== alimentoActualId,
  );

  const hipotesis: HipotesisRecomendacion[] = [];

  hipotesis.push({
    codigo: 'desperdicio',
    etiqueta: 'Desperdicio o mal manejo en comedero',
    score: bajasRecientes > 0 ? 55 : 80,
    motivo:
      'Consumo por encima del promedio sin causa registrada; posible desperdicio en comederos.',
  });

  if (esCritico) {
    hipotesis.push({
      codigo: 'error_registro',
      etiqueta: 'Posible error de registro',
      score: 85,
      motivo: `El desvio (${redondear(desvioPct)}%) supera el umbral critico; conviene verificar la carga del dato.`,
    });
  }

  if (alimentoCambio) {
    hipotesis.push({
      codigo: 'cambio_racion',
      etiqueta: 'Cambio de racion o etapa',
      score: 70,
      motivo:
        'El alimento del registro difiere del historico reciente del lote; el cambio de racion puede explicar el consumo.',
    });
  }

  if (bajasRecientes > 0) {
    hipotesis.push({
      codigo: 'enfermedad_temprana',
      etiqueta: 'Revisar condicion del lote',
      score: 75,
      motivo: `Se registraron ${bajasRecientes} baja(s) reciente(s); conviene revisar la condicion sanitaria del lote.`,
    });
  }

  hipotesis.sort((a, b) => b.score - a.score);

  return {
    hayDesvio: true,
    promedioHistorico: redondear(promedio),
    desvioPct: redondear(desvioPct),
    severidad: esCritico
      ? SeveridadRecomendacion.CRITICA
      : SeveridadRecomendacion.ADVERTENCIA,
    hipotesis,
  };
}

/** Acción sugerida derivada de la hipótesis principal. */
export function accionSugeridaPara(hipotesisPrincipal?: HipotesisRecomendacion): string {
  switch (hipotesisPrincipal?.codigo) {
    case 'error_registro':
      return 'Verificar el registro de consumo y corregir si hubo un error de carga.';
    case 'cambio_racion':
      return 'Confirmar si hubo un cambio de racion o etapa y ajustar el plan de alimentacion.';
    case 'enfermedad_temprana':
      return 'Revisar la condicion del lote y consultar al veterinario si corresponde.';
    case 'desperdicio':
    default:
      return 'Revisar comederos y manejo para descartar desperdicio de alimento.';
  }
}

/** Mensaje al usuario por plantilla (fallback sin LLM). */
export function construirMensajePlantilla(
  loteCodigo: string,
  desvioPct: number,
  promedioHistorico: number,
  hipotesisPrincipal?: HipotesisRecomendacion,
): string {
  const causa = hipotesisPrincipal
    ? ` La causa mas probable: ${hipotesisPrincipal.etiqueta.toLowerCase()}.`
    : '';
  return (
    `El lote ${loteCodigo} consumio ${desvioPct}% por encima de su promedio ` +
    `historico (${promedioHistorico} kg).${causa}`
  );
}
