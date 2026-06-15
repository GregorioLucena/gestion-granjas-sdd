import { BusinessRuleError, ConflictError, ForbiddenError } from '@gestion-granjas/shared/errors';
import { PERMISOS } from '@gestion-granjas/shared/permissions';
import type { TenantContext } from '@gestion-granjas/shared';
import { Granja, Perfil } from '@gestion-granjas/database/entities';
import { EstadoRegistro } from '@gestion-granjas/database/enums';
import { In, type Repository } from 'typeorm';

export function canManageAllUsers(ctx: TenantContext): boolean {
  return ctx.permisos.includes(PERMISOS.COMPANIAS_CREAR);
}

export async function assertGranjasBelongToCompania(
  granjaIds: string[],
  companiaId: string,
  granjaRepo: Repository<Granja>,
): Promise<void> {
  if (granjaIds.length === 0) {
    throw new BusinessRuleError('USUARIO_SIN_GRANJA', 'El usuario debe tener acceso a al menos una granja.');
  }

  const granjas = await granjaRepo.find({ where: { id: In(granjaIds) } });
  const invalid = granjas.some(
    (granja) => granja.companiaId !== companiaId || granja.estadoRegistro !== EstadoRegistro.ACTIVO,
  );

  if (invalid || granjas.length !== granjaIds.length) {
    throw new BusinessRuleError('USUARIO_GRANJA_EXTERNA', 'No puede asignar una granja de otra compania.');
  }
}

export async function assertPerfilesActivos(
  perfilIds: string[],
  perfilRepo: Repository<Perfil>,
): Promise<void> {
  if (perfilIds.length === 0) {
    throw new BusinessRuleError('USUARIO_SIN_PERFIL', 'El usuario debe tener al menos un perfil activo.');
  }

  const perfiles = await perfilRepo.find({ where: { id: In(perfilIds) } });
  const invalid = perfiles.some((perfil) => perfil.estadoRegistro !== EstadoRegistro.ACTIVO);

  if (invalid || perfiles.length !== perfilIds.length) {
    throw new ConflictError('PERFIL_INACTIVO', 'El perfil esta inactivo.');
  }
}

export function assertUsuarioScope(ctx: TenantContext, companiaId: string): void {
  if (!canManageAllUsers(ctx) && companiaId !== ctx.companiaId) {
    throw new ForbiddenError('FORBIDDEN', 'No tiene permiso para gestionar usuarios de otra compania.');
  }
}
