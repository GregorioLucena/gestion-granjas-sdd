import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AppError, UnauthorizedError } from '@gestion-granjas/shared/errors';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { TENANT_CONTEXT_KEY } from '../common/tenant/tenant-context.decorator';
import { toTenantContext, type JwtPayload } from './auth.utils';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      [TENANT_CONTEXT_KEY]?: ReturnType<typeof toTenantContext>;
    }>();

    const authorization = request.headers.authorization;
    const header = Array.isArray(authorization) ? authorization[0] : authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Debe iniciar sesion para continuar.');
    }

    const token = header.slice('Bearer '.length);

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      request[TENANT_CONTEXT_KEY] = toTenantContext(payload);
      return true;
    } catch {
      throw new AppError('AUTH_TOKEN_INVALID', 'Sesion no valida. Vuelva a iniciar sesion.', 401);
    }
  }
}
