import type { HipotesisRecomendacion } from '@gestion-granjas/database/entities';

export type ContextoRedaccionConsumo = {
  loteCodigo: string;
  desvioPct: number;
  promedioHistorico: number;
  cantidadActual: number;
  registrosHistoricos: number;
  ventanaDias: number;
  hipotesis: HipotesisRecomendacion[];
  accionSugerida: string;
};

export const LLM_SYSTEM_PROMPT =
  'Eres un asistente operativo de granja. Explicas una alerta de consumo al encargado de campo. ' +
  'Usa solo los datos del usuario. No inventes numeros, lotes ni causas. ' +
  'No des diagnostico veterinario. No uses jerga tecnica. ' +
  'Responde en espanol, en 2 a 4 frases, sin titulos ni listas.';

export function construirPromptRedaccion(ctx: ContextoRedaccionConsumo): string {
  const hipotesis = ctx.hipotesis
    .map(
      (item, index) =>
        `${index + 1}. ${item.etiqueta} (score ${item.score}): ${item.motivo}`,
    )
    .join('\n');

  return [
    'Redacta el texto "Por que lo sugerimos" con estos datos ya calculados por el sistema:',
    '',
    `Lote: ${ctx.loteCodigo}`,
    `Consumo registrado: ${ctx.cantidadActual} kg`,
    `Promedio historico: ${ctx.promedioHistorico} kg`,
    `Desvio: ${ctx.desvioPct}%`,
    `Ventana: ${ctx.ventanaDias} dias (${ctx.registrosHistoricos} registros)`,
    '',
    'Hipotesis ordenadas por score (no las reordenes ni cambies los scores):',
    hipotesis || '(sin hipotesis)',
    '',
    `Accion sugerida por reglas: ${ctx.accionSugerida}`,
    '',
    'Menciona el desvio y la causa mas probable. No agregues datos que no esten en esta lista.',
  ].join('\n');
}

export function sanitizarMensajeLlm(texto: string): string | undefined {
  const limpio = texto
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (limpio.length < 40) return undefined;
  if (limpio.length <= 700) return limpio;
  return `${limpio.slice(0, 697).trimEnd()}...`;
}
