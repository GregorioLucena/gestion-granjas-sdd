import { z } from 'zod';

export const decidirRecomendacionSchema = z.object({
  decision: z.enum(['aceptada', 'descartada']),
  motivo: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
});

export const listarRecomendacionesFiltroSchema = z.object({
  granjaId: z.string().uuid().optional(),
  estado: z
    .enum([
      'PENDIENTE',
      'EN_COLA',
      'ACEPTADA',
      'DESCARTADA',
      'ACEPTADA_EN_EVALUACION',
      'CERRADA',
      'SUPERSEDED',
    ])
    .optional(),
  tipo: z
    .enum(['CONSUMO_DESVIO', 'STOCK_REPOSICION', 'EVALUACION_CIERRE'])
    .optional(),
});

export type DecidirRecomendacionInput = z.infer<typeof decidirRecomendacionSchema>;
export type ListarRecomendacionesFiltro = z.infer<
  typeof listarRecomendacionesFiltroSchema
>;
