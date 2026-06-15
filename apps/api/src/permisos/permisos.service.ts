import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PERMISOS, requirePermission } from '@gestion-granjas/shared/permissions';
import type { TenantContext } from '@gestion-granjas/shared';
import { Permiso } from '@gestion-granjas/database/entities';

@Injectable()
export class PermisosService {
  constructor(@InjectRepository(Permiso) private readonly permisoRepo: Repository<Permiso>) {}

  async listar(ctx: TenantContext) {
    requirePermission(ctx, PERMISOS.PERFILES_ADMINISTRAR);

    const permisos = await this.permisoRepo.find({ order: { modulo: 'ASC', codigo: 'ASC' } });

    return permisos.map((permiso) => ({
      id: permiso.id,
      codigo: permiso.codigo,
      nombre: permiso.nombre,
      modulo: permiso.modulo,
      accion: permiso.accion,
      descripcion: permiso.descripcion,
    }));
  }
}
