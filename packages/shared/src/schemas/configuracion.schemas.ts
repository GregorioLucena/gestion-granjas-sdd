import { z } from 'zod';

export const estadoRegistroSchema = z.enum(['ACTIVO', 'INACTIVO']);

export const crearCompaniaSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  identificacionFiscal: z.string().trim().max(50).optional(),
  telefono: z.string().trim().max(30).optional(),
  correo: z.string().trim().email().max(120).optional().or(z.literal('')),
  direccion: z.string().trim().max(200).optional(),
});

export const actualizarCompaniaSchema = crearCompaniaSchema
  .partial()
  .extend({ estadoRegistro: estadoRegistroSchema.optional() })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar.',
  });

export const crearGranjaSchema = z.object({
  companiaId: z.string().uuid(),
  nombre: z.string().trim().min(2).max(120),
  codigo: z.string().trim().max(30).optional(),
  direccion: z.string().trim().max(200).optional(),
});

export const actualizarGranjaSchema = z
  .object({
    nombre: z.string().trim().min(2).max(120).optional(),
    codigo: z.string().trim().max(30).optional(),
    direccion: z.string().trim().max(200).optional(),
    estadoRegistro: estadoRegistroSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar.',
  });

export const maestraCompaniaBaseSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  descripcion: z.string().trim().max(300).optional(),
});

export const crearTipoAnimalSchema = maestraCompaniaBaseSchema.extend({
  requiereRaza: z.boolean().default(false),
  duracionGestacionDias: z.number().int().min(1).max(400).optional(),
});

export const actualizarTipoAnimalSchema = crearTipoAnimalSchema
  .partial()
  .extend({ estadoRegistro: estadoRegistroSchema.optional() })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar.',
  });

export const crearRazaSchema = maestraCompaniaBaseSchema.extend({
  tipoAnimalId: z.string().uuid(),
});

export const actualizarRazaSchema = maestraCompaniaBaseSchema
  .partial()
  .extend({ estadoRegistro: estadoRegistroSchema.optional() })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar.',
  });

export const actualizarMaestraCompaniaSchema = maestraCompaniaBaseSchema
  .partial()
  .extend({ estadoRegistro: estadoRegistroSchema.optional() })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar.',
  });

export const crearUbicacionSchema = z.object({
  granjaId: z.string().uuid(),
  tipoUbicacionId: z.string().uuid(),
  nombre: z.string().trim().min(2).max(120),
  codigo: z.string().trim().max(30).optional(),
  descripcion: z.string().trim().max(300).optional(),
});

export const actualizarUbicacionSchema = crearUbicacionSchema
  .omit({ granjaId: true, tipoUbicacionId: true })
  .partial()
  .extend({ estadoRegistro: estadoRegistroSchema.optional() })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar.',
  });

export type CrearCompaniaInput = z.infer<typeof crearCompaniaSchema>;
export type ActualizarCompaniaInput = z.infer<typeof actualizarCompaniaSchema>;
export type CrearGranjaInput = z.infer<typeof crearGranjaSchema>;
export type ActualizarGranjaInput = z.infer<typeof actualizarGranjaSchema>;
export type CrearTipoAnimalInput = z.infer<typeof crearTipoAnimalSchema>;
export type ActualizarTipoAnimalInput = z.infer<typeof actualizarTipoAnimalSchema>;
export type CrearRazaInput = z.infer<typeof crearRazaSchema>;
export type ActualizarRazaInput = z.infer<typeof actualizarRazaSchema>;
export type CrearUbicacionInput = z.infer<typeof crearUbicacionSchema>;
export type ActualizarUbicacionInput = z.infer<typeof actualizarUbicacionSchema>;
export type ActualizarMaestraCompaniaInput = z.infer<typeof actualizarMaestraCompaniaSchema>;
export type CrearMaestraCompaniaInput = z.infer<typeof maestraCompaniaBaseSchema>;
