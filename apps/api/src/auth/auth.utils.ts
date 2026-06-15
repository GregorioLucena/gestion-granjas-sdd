import type { TenantContext } from '@gestion-granjas/shared';
import { EstadoRegistro } from '@gestion-granjas/database/enums';
import type { Usuario } from '@gestion-granjas/database/entities';

export type JwtPayload = TenantContext & {
  sessionId: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function buildAuthFromUsuario(usuario: Usuario): {
  permisos: string[];
  granjaIds: string[];
} {
  const permisos = new Set<string>();

  for (const usuarioPerfil of usuario.perfiles ?? []) {
    if (usuarioPerfil.perfil?.estadoRegistro !== EstadoRegistro.ACTIVO) {
      continue;
    }

    for (const perfilPermiso of usuarioPerfil.perfil?.permisos ?? []) {
      if (perfilPermiso.permiso?.codigo) {
        permisos.add(perfilPermiso.permiso.codigo);
      }
    }
  }

  const granjaIds = (usuario.granjas ?? [])
    .map((ug) => ug.granjaId)
    .filter((id): id is string => Boolean(id));

  return { permisos: [...permisos], granjaIds };
}

export function resolveGranjaActivaId(granjaIds: string[], current?: string): string | undefined {
  if (granjaIds.length === 0) {
    return undefined;
  }

  if (current && granjaIds.includes(current)) {
    return current;
  }

  return granjaIds.length === 1 ? granjaIds[0] : undefined;
}

export function toTenantContext(payload: JwtPayload): TenantContext {
  return {
    userId: payload.userId,
    companiaId: payload.companiaId,
    granjaIds: payload.granjaIds,
    permisos: payload.permisos,
    granjaActivaId: payload.granjaActivaId,
    sessionId: payload.sessionId,
  };
}
