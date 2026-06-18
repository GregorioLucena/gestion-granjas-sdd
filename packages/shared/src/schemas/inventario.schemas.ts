import { z } from 'zod';
import {
  actualizarMaestraCompaniaSchema,
  estadoRegistroSchema,
  maestraCompaniaBaseSchema,
} from './configuracion.schemas';

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

const optionalEmailSchema = z
  .string()
  .trim()
  .email()
  .max(120)
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined);

export const crearTipoAlimentoSchema = maestraCompaniaBaseSchema;
export const actualizarTipoAlimentoSchema = actualizarMaestraCompaniaSchema;

export const crearPresentacionAlimentoSchema = maestraCompaniaBaseSchema;
export const actualizarPresentacionAlimentoSchema = actualizarMaestraCompaniaSchema;

export const crearProveedorSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  identificacionFiscal: z.string().trim().max(50).optional(),
  telefono: z.string().trim().max(30).optional(),
  correo: optionalEmailSchema,
  direccion: z.string().trim().max(200).optional(),
});

export const actualizarProveedorSchema = crearProveedorSchema
  .partial()
  .extend({ estadoRegistro: estadoRegistroSchema.optional() })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar.',
  });

export const crearAlmacenSchema = z.object({
  granjaId: z.string().uuid(),
  nombre: z.string().trim().min(2).max(120),
  codigo: z.string().trim().max(30).optional(),
  ubicacionId: optionalUuidSchema,
  observaciones: optionalTextSchema,
});

export const actualizarAlmacenSchema = z
  .object({
    nombre: z.string().trim().min(2).max(120).optional(),
    codigo: z.string().trim().max(30).optional(),
    ubicacionId: optionalUuidSchema,
    observaciones: optionalTextSchema,
    estadoRegistro: estadoRegistroSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar.',
  });

export const crearAlimentoSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  tipoAlimentoId: z.string().uuid(),
  presentacionId: z.string().uuid(),
  unidadMedidaId: z.string().uuid(),
  factorConversion: z.coerce.number().positive().default(1),
  costoReferencia: z.coerce.number().min(0).optional(),
  observaciones: optionalTextSchema,
});

export const actualizarAlimentoSchema = z
  .object({
    nombre: z.string().trim().min(2).max(120).optional(),
    tipoAlimentoId: z.string().uuid().optional(),
    presentacionId: z.string().uuid().optional(),
    unidadMedidaId: z.string().uuid().optional(),
    factorConversion: z.coerce.number().positive().optional(),
    costoReferencia: z.coerce.number().min(0).optional(),
    observaciones: optionalTextSchema,
    estadoRegistro: estadoRegistroSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar.',
  });

export const crearMovimientoInventarioSchema = z.object({
  granjaId: z.string().uuid(),
  almacenId: z.string().uuid(),
  alimentoId: z.string().uuid(),
  tipoMovimientoId: z.string().uuid(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cantidad: z.coerce.number().positive(),
  costoUnitario: z.coerce.number().min(0).optional(),
  proveedorId: optionalUuidSchema,
  referencia: z.string().trim().max(80).optional(),
  motivoAjuste: z.string().trim().max(200).optional(),
  observaciones: optionalTextSchema,
});

export const anularMovimientoInventarioSchema = z.object({
  motivoAnulacion: z.string().trim().min(3).max(300),
});

export type CrearTipoAlimentoInput = z.infer<typeof crearTipoAlimentoSchema>;
export type ActualizarTipoAlimentoInput = z.infer<typeof actualizarTipoAlimentoSchema>;
export type CrearPresentacionAlimentoInput = z.infer<typeof crearPresentacionAlimentoSchema>;
export type ActualizarPresentacionAlimentoInput = z.infer<
  typeof actualizarPresentacionAlimentoSchema
>;
export type CrearProveedorInput = z.infer<typeof crearProveedorSchema>;
export type ActualizarProveedorInput = z.infer<typeof actualizarProveedorSchema>;
export type CrearAlmacenInput = z.infer<typeof crearAlmacenSchema>;
export type ActualizarAlmacenInput = z.infer<typeof actualizarAlmacenSchema>;
export type CrearAlimentoInput = z.infer<typeof crearAlimentoSchema>;
export type ActualizarAlimentoInput = z.infer<typeof actualizarAlimentoSchema>;
export type CrearMovimientoInventarioInput = z.infer<typeof crearMovimientoInventarioSchema>;
export type AnularMovimientoInventarioInput = z.infer<typeof anularMovimientoInventarioSchema>;
