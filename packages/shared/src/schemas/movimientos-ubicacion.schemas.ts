import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optionalTextSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined);

export const crearMovimientoUbicacionSchema = z.object({
  granjaId: z.string().uuid(),
  loteId: z.string().uuid(),
  ubicacionDestinoId: z.string().uuid(),
  fecha: dateSchema,
  motivoId: z.string().uuid(),
  observaciones: optionalTextSchema,
});

export const anularMovimientoUbicacionSchema = z.object({
  motivo: z.string().trim().min(3).max(300),
});

export type CrearMovimientoUbicacionInput = z.infer<typeof crearMovimientoUbicacionSchema>;
export type AnularMovimientoUbicacionInput = z.infer<typeof anularMovimientoUbicacionSchema>;
