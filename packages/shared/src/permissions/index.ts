import type { TenantContext } from '../types/tenant';
import { ForbiddenError } from '../errors';

export * from './constants';

export function hasPermission(ctx: TenantContext, codigo: string): boolean {
  return ctx.permisos.some((permiso) => {
    if (permiso === codigo) return true;
    if (permiso.endsWith('.*')) {
      const prefix = permiso.slice(0, -1);
      return codigo.startsWith(prefix);
    }
    return false;
  });
}

export function requirePermission(ctx: TenantContext, codigo: string): void {
  if (!hasPermission(ctx, codigo)) {
    throw new ForbiddenError('FORBIDDEN', 'No tiene permiso para realizar esta accion.');
  }
}

export function requireGranjaAccess(ctx: TenantContext, granjaId: string): void {
  if (!ctx.granjaIds.includes(granjaId)) {
    throw new ForbiddenError('GRANJA_ACCESS_DENIED', 'No tiene acceso a esta granja.');
  }
}
