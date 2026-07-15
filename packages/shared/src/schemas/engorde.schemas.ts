import { z } from 'zod';

const optionalTextSchema = z
  .string()
  .trim()
  .max(300)
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined);

const modalidadPesoSchema = z.enum(['PROMEDIO_LOTE', 'MUESTRA']);

const pesoPromedioSchema = z.coerce.number().positive();

export const estadoEngordeSchema = z.enum(['EN_CURSO', 'CERRADO', 'ANULADO']);

export const iniciarEngordeSchema = z
  .object({
    granjaId: z.string().uuid(),
    loteId: z.string().uuid(),
    fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    pesoInicialPromedioKg: pesoPromedioSchema.optional(),
    modalidadPesoInicial: modalidadPesoSchema.optional(),
    metodoPesajeInicialId: z.string().uuid().optional(),
    cantidadMuestraInicial: z.coerce.number().int().positive().optional(),
    objetivoPesoKg: pesoPromedioSchema.optional(),
    observaciones: optionalTextSchema,
  })
  .superRefine((data, ctx) => {
    const hasPeso = data.pesoInicialPromedioKg !== undefined;
    if (hasPeso && !data.modalidadPesoInicial) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe indicar la modalidad del peso inicial.',
        path: ['modalidadPesoInicial'],
      });
    }
    if (hasPeso && !data.metodoPesajeInicialId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe indicar el metodo de pesaje inicial.',
        path: ['metodoPesajeInicialId'],
      });
    }
    if (data.modalidadPesoInicial === 'MUESTRA' && data.cantidadMuestraInicial === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe indicar la cantidad de muestra.',
        path: ['cantidadMuestraInicial'],
      });
    }
    if (
      data.modalidadPesoInicial === 'PROMEDIO_LOTE' &&
      data.cantidadMuestraInicial !== undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'No informe cantidad de muestra para un promedio de lote.',
        path: ['cantidadMuestraInicial'],
      });
    }
    if (!hasPeso && (data.modalidadPesoInicial || data.metodoPesajeInicialId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indique el peso inicial para registrar el control de pesaje.',
        path: ['pesoInicialPromedioKg'],
      });
    }
  });

export const crearBajaEngordeSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cantidad: z.coerce.number().int().positive(),
  motivoId: z.string().uuid(),
  observaciones: optionalTextSchema,
});

export const cerrarEngordeSchema = z
  .object({
    fechaCierre: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    cantidadFinal: z.coerce.number().int().min(0),
    motivoCierreId: z.string().uuid(),
    pesoFinalPromedioKg: pesoPromedioSchema.optional(),
    modalidadPesoFinal: modalidadPesoSchema.optional(),
    metodoPesajeFinalId: z.string().uuid().optional(),
    cantidadMuestraFinal: z.coerce.number().int().positive().optional(),
    observaciones: optionalTextSchema,
  })
  .superRefine((data, ctx) => {
    const hasPeso = data.pesoFinalPromedioKg !== undefined;
    if (hasPeso && !data.modalidadPesoFinal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe indicar la modalidad del peso final.',
        path: ['modalidadPesoFinal'],
      });
    }
    if (hasPeso && !data.metodoPesajeFinalId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe indicar el metodo de pesaje final.',
        path: ['metodoPesajeFinalId'],
      });
    }
    if (data.modalidadPesoFinal === 'MUESTRA' && data.cantidadMuestraFinal === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe indicar la cantidad de muestra.',
        path: ['cantidadMuestraFinal'],
      });
    }
    if (data.modalidadPesoFinal === 'PROMEDIO_LOTE' && data.cantidadMuestraFinal !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'No informe cantidad de muestra para un promedio de lote.',
        path: ['cantidadMuestraFinal'],
      });
    }
    if (!hasPeso && (data.modalidadPesoFinal || data.metodoPesajeFinalId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indique el peso final para registrar el control de pesaje.',
        path: ['pesoFinalPromedioKg'],
      });
    }
  });

export const anularEngordeSchema = z.object({
  motivo: z.string().trim().min(3).max(300),
});

export const crearMotivoBajaEngordeSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  descripcion: optionalTextSchema,
  cuentaComoMortalidad: z.boolean(),
});

export const actualizarMotivoBajaEngordeSchema = crearMotivoBajaEngordeSchema
  .partial()
  .extend({
    estadoRegistro: z.enum(['ACTIVO', 'INACTIVO']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar.',
  });

export type IniciarEngordeInput = z.infer<typeof iniciarEngordeSchema>;
export type CrearBajaEngordeInput = z.infer<typeof crearBajaEngordeSchema>;
export type CerrarEngordeInput = z.infer<typeof cerrarEngordeSchema>;
export type AnularEngordeInput = z.infer<typeof anularEngordeSchema>;
export type CrearMotivoBajaEngordeInput = z.infer<typeof crearMotivoBajaEngordeSchema>;
export type ActualizarMotivoBajaEngordeInput = z.infer<typeof actualizarMotivoBajaEngordeSchema>;
