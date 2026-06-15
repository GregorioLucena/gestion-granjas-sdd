import { z } from 'zod';
import { LIST_PAGE_SIZE } from './pagination.schemas';

export const PASSWORD_POLICY_MESSAGE =
  'La contrasena debe tener al menos 8 caracteres, una mayuscula, un numero y un caracter especial.';

export const passwordSchema = z
  .string()
  .min(8, PASSWORD_POLICY_MESSAGE)
  .regex(/[A-Z]/, PASSWORD_POLICY_MESSAGE)
  .regex(/[0-9]/, PASSWORD_POLICY_MESSAGE)
  .regex(/[^A-Za-z0-9]/, PASSWORD_POLICY_MESSAGE);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Ingresa un correo valido.');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Este campo es obligatorio.'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const crearUsuarioSchema = z.object({
  nombre: z.string().trim().min(1, 'Este campo es obligatorio.'),
  apellido: z.string().trim().optional(),
  email: emailSchema,
  password: passwordSchema,
  companiaId: z.string().uuid(),
  granjaIds: z.array(z.string().uuid()).min(1),
  perfilIds: z.array(z.string().uuid()).min(1),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'BLOQUEADO']).default('ACTIVO'),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;

export const actualizarUsuarioSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  apellido: z.string().trim().optional(),
  granjaIds: z.array(z.string().uuid()).min(1).optional(),
  perfilIds: z.array(z.string().uuid()).min(1).optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'BLOQUEADO']).optional(),
});

export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;

export const restablecerContrasenaSchema = z.object({
  password: passwordSchema,
});

export type RestablecerContrasenaInput = z.infer<typeof restablecerContrasenaSchema>;

export const crearPerfilSchema = z.object({
  nombre: z.string().trim().min(1, 'Este campo es obligatorio.'),
  descripcion: z.string().trim().optional(),
  permisoIds: z.array(z.string().uuid()).min(1),
  estadoRegistro: z.enum(['ACTIVO', 'INACTIVO']).default('ACTIVO'),
});

export type CrearPerfilInput = z.infer<typeof crearPerfilSchema>;

export const actualizarPerfilSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  descripcion: z.string().trim().optional(),
  permisoIds: z.array(z.string().uuid()).min(1).optional(),
  estadoRegistro: z.enum(['ACTIVO', 'INACTIVO']).optional(),
});

export type ActualizarPerfilInput = z.infer<typeof actualizarPerfilSchema>;

export const granjaActivaSchema = z.object({
  granjaId: z.string().uuid(),
});

export type GranjaActivaInput = z.infer<typeof granjaActivaSchema>;

export const usuarioListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(LIST_PAGE_SIZE),
  search: z.string().trim().optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'BLOQUEADO', 'TODOS']).default('ACTIVO'),
});

export type UsuarioListQuery = z.infer<typeof usuarioListQuerySchema>;

export type AuthUserResponse = {
  id: string;
  nombre: string;
  apellido?: string | null;
  email: string;
  companiaId: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  granjaIds: string[];
  granjaActivaId?: string;
  permisos: string[];
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUserResponse;
};
