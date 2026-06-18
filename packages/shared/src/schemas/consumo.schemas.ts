import { z } from 'zod';

const optionalTextSchema = z
  .string()
  .trim()
  .max(300)
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined);

export const crearConsumoAlimentoSchema = z.object({
  granjaId: z.string().uuid(),
  loteId: z.string().uuid(),
  alimentoId: z.string().uuid(),
  almacenId: z.string().uuid(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cantidad: z.coerce.number().positive(),
  observaciones: optionalTextSchema,
});

export const anularConsumoAlimentoSchema = z.object({
  motivoAnulacion: z.string().trim().min(3).max(300),
});

export type CrearConsumoAlimentoInput = z.infer<typeof crearConsumoAlimentoSchema>;
export type AnularConsumoAlimentoInput = z.infer<typeof anularConsumoAlimentoSchema>;
