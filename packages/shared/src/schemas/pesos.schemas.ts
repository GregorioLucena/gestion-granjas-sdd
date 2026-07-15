import { z } from 'zod';

const optionalTextSchema = z
  .string()
  .trim()
  .max(300)
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined);

export const crearControlPesoSchema = z
  .object({
    engordeId: z.string().uuid(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    modalidad: z.enum(['PROMEDIO_LOTE', 'MUESTRA']),
    metodoPesajeId: z.string().uuid(),
    pesoPromedioKg: z.coerce.number().positive(),
    cantidadMuestra: z.coerce.number().int().positive().optional(),
    observaciones: optionalTextSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.modalidad === 'MUESTRA' && data.cantidadMuestra === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe indicar la cantidad de muestra.',
        path: ['cantidadMuestra'],
      });
    }
    if (data.modalidad === 'PROMEDIO_LOTE' && data.cantidadMuestra !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'No informe cantidad de muestra para un promedio de lote.',
        path: ['cantidadMuestra'],
      });
    }
  });

export const anularControlPesoSchema = z
  .object({
    motivo: z.string().trim().min(3).max(300),
  })
  .strict();

export type CrearControlPesoInput = z.infer<typeof crearControlPesoSchema>;
export type AnularControlPesoInput = z.infer<typeof anularControlPesoSchema>;
