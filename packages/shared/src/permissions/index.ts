import type { TenantContext } from '../types/tenant';
import { ForbiddenError } from '../errors';

export function requirePermission(ctx: TenantContext, codigo: string): void {
  if (!ctx.permisos.includes(codigo)) {
    throw new ForbiddenError('FORBIDDEN', 'No tiene permiso para realizar esta accion.');
  }
}

export function requireGranjaAccess(ctx: TenantContext, granjaId: string): void {
  if (!ctx.granjaIds.includes(granjaId)) {
    throw new ForbiddenError('GRANJA_ACCESS_DENIED', 'No tiene acceso a esta granja.');
  }
}
