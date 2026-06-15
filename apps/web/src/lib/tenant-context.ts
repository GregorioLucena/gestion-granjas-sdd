import type { TenantContext } from '@gestion-granjas/shared';
import { hasPermission } from '@gestion-granjas/shared/permissions';
import type { AuthUserResponse } from '@gestion-granjas/shared/schemas/seguridad.schemas';

export function tenantContextFromUser(user: AuthUserResponse): TenantContext {
  return {
    userId: user.id,
    companiaId: user.companiaId,
    granjaIds: user.granjaIds,
    permisos: user.permisos,
    granjaActivaId: user.granjaActivaId,
  };
}

export function userHasAnyPermission(user: AuthUserResponse, permissions: string[]): boolean {
  const ctx = tenantContextFromUser(user);
  return permissions.some((codigo) => hasPermission(ctx, codigo));
}
