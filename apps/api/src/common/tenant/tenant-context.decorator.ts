import { createParamDecorator, ExecutionContext, Injectable } from '@nestjs/common';
import type { TenantContext } from '@gestion-granjas/shared';

export const TENANT_CONTEXT_KEY = 'tenantContext';

export const TenantCtx = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest<{ [TENANT_CONTEXT_KEY]: TenantContext }>();
    return request[TENANT_CONTEXT_KEY];
  },
);

@Injectable()
export class TenantContextService {
  attach(request: { [key: string]: unknown }, tenant: TenantContext) {
    request[TENANT_CONTEXT_KEY] = tenant;
  }
}
