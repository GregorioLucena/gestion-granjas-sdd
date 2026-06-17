import { z } from 'zod';
import { estadoRegistroSchema } from './configuracion.schemas';

export const estadoLoteSchema = z.enum(['ACTIVO', 'CERRADO', 'CANCELADO']);

const optionalUuidSchema = z
  .string()
  .uuid()
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined);
const optionalTextSchema = z
  .string()
  .trim()
  .max(300)
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined);

export const crearLoteSchema = z.object({
  granjaId: z.string().uuid(),
  codigo: z.string().trim().min(2).max(50),
  tipoAnimalId: z.string().uuid(),
  finalidadProductivaId: z.string().uuid(),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cantidadInicial: z.coerce.number().int().min(1),
  ubicacionId: optionalUuidSchema,
  estadoOperativo: estadoLoteSchema.default('ACTIVO'),
  observaciones: optionalTextSchema,
});

export const actualizarLoteSchema = z
  .object({
    codigo: z.string().trim().min(2).max(50).optional(),
    tipoAnimalId: z.string().uuid().optional(),
    finalidadProductivaId: z.string().uuid().optional(),
    fechaInicio: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    cantidadInicial: z.coerce.number().int().min(1).optional(),
    ubicacionId: optionalUuidSchema,
    estadoOperativo: estadoLoteSchema.optional(),
    estadoRegistro: estadoRegistroSchema.optional(),
    observaciones: optionalTextSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar.',
  });

export type EstadoLoteInput = z.infer<typeof estadoLoteSchema>;
export type CrearLoteInput = z.infer<typeof crearLoteSchema>;
export type ActualizarLoteInput = z.infer<typeof actualizarLoteSchema>;
