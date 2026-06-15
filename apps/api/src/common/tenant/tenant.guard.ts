import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '@gestion-granjas/database/entities';
import { UnauthorizedError } from '@gestion-granjas/shared/errors';
import type { TenantContext } from '@gestion-granjas/shared';
import { TENANT_CONTEXT_KEY } from './tenant-context.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      [TENANT_CONTEXT_KEY]?: TenantContext;
    }>();

    const devEmail =
      (request.headers['x-dev-user-email'] as string | undefined) ??
      process.env.DEV_USER_EMAIL ??
      'admin@demo.local';

    const usuario = await this.usuarioRepo.findOne({
      where: { email: devEmail },
      relations: {
        granjas: { granja: true },
        perfiles: { perfil: { permisos: { permiso: true } } },
      },
    });

    if (!usuario) {
      throw new UnauthorizedError('Usuario de desarrollo no encontrado. Ejecute pnpm db:seed.');
    }

    const permisos = new Set<string>();
    for (const usuarioPerfil of usuario.perfiles ?? []) {
      for (const perfilPermiso of usuarioPerfil.perfil?.permisos ?? []) {
        if (perfilPermiso.permiso?.codigo) {
          permisos.add(perfilPermiso.permiso.codigo);
        }
      }
    }

    const granjaIds = (usuario.granjas ?? [])
      .map((ug) => ug.granjaId)
      .filter((id): id is string => Boolean(id));

    request[TENANT_CONTEXT_KEY] = {
      userId: usuario.id,
      companiaId: usuario.companiaId,
      granjaIds,
      permisos: [...permisos],
      granjaActivaId: granjaIds[0],
    };

    return true;
  }
}
