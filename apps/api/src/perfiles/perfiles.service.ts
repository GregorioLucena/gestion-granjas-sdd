import { ConflictError, NotFoundError } from '@gestion-granjas/shared/errors';
import { PERMISOS, hasPermission, requirePermission } from '@gestion-granjas/shared/permissions';
import type { TenantContext } from '@gestion-granjas/shared';
import type {
  ActualizarPerfilInput,
  CrearPerfilInput,
} from '@gestion-granjas/shared/schemas/seguridad.schemas';
import {
  actualizarPerfilSchema,
  crearPerfilSchema,
} from '@gestion-granjas/shared/schemas/seguridad.schemas';
import type { ListQuery, PaginatedResponse } from '@gestion-granjas/shared/schemas/pagination.schemas';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Perfil, PerfilPermiso, Permiso } from '@gestion-granjas/database/entities';
import { EstadoRegistro } from '@gestion-granjas/database/enums';
import { paginate, parseListQuery } from '../common/pagination/paginate';

type PerfilListItem = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  estadoRegistro: Perfil['estadoRegistro'];
  permisoIds: string[];
};

@Injectable()
export class PerfilesService {
  constructor(
    @InjectRepository(Perfil) private readonly perfilRepo: Repository<Perfil>,
    @InjectRepository(Permiso) private readonly permisoRepo: Repository<Permiso>,
    private readonly dataSource: DataSource,
  ) {}

  assertCanView(ctx: TenantContext): void {
    if (
      !hasPermission(ctx, PERMISOS.PERFILES_ADMINISTRAR) &&
      !hasPermission(ctx, PERMISOS.USUARIOS_VER)
    ) {
      requirePermission(ctx, PERMISOS.PERFILES_ADMINISTRAR);
    }
  }

  async listar(ctx: TenantContext, query: ListQuery): Promise<PaginatedResponse<PerfilListItem>> {
    this.assertCanView(ctx);

    const qb = this.perfilRepo
      .createQueryBuilder('perfil')
      .leftJoinAndSelect('perfil.permisos', 'perfilPermiso');

    const page = await paginate(qb, query, 'perfil');

    return {
      items: page.items.map((perfil) => this.toListItem(perfil)),
      meta: page.meta,
    };
  }

  async crear(ctx: TenantContext, input: CrearPerfilInput) {
    requirePermission(ctx, PERMISOS.PERFILES_ADMINISTRAR);
    const parsed = crearPerfilSchema.parse(input);
    await this.assertPermisosExist(parsed.permisoIds);

    const exists = await this.perfilRepo.findOne({ where: { nombre: parsed.nombre } });
    if (exists) {
      throw new ConflictError('PERFIL_NOMBRE_DUPLICADO', 'Ya existe un perfil con ese nombre.');
    }

    const perfilId = await this.dataSource.transaction(async (manager) => {
      const perfil = await manager.save(
        manager.create(Perfil, {
          nombre: parsed.nombre.trim(),
          descripcion: parsed.descripcion?.trim() || undefined,
          estadoRegistro: parsed.estadoRegistro as EstadoRegistro,
        }),
      );

      await manager.save(
        parsed.permisoIds.map((permisoId) =>
          manager.create(PerfilPermiso, { perfilId: perfil.id, permisoId }),
        ),
      );

      return perfil.id;
    });

    return this.findById(perfilId);
  }

  async actualizar(ctx: TenantContext, id: string, input: ActualizarPerfilInput) {
    requirePermission(ctx, PERMISOS.PERFILES_ADMINISTRAR);
    const parsed = actualizarPerfilSchema.parse(input);
    const perfil = await this.perfilRepo.findOne({ where: { id } });

    if (!perfil) {
      throw new NotFoundError('El perfil solicitado no existe.');
    }

    if (parsed.nombre && parsed.nombre !== perfil.nombre) {
      const exists = await this.perfilRepo.findOne({ where: { nombre: parsed.nombre } });
      if (exists) {
        throw new ConflictError('PERFIL_NOMBRE_DUPLICADO', 'Ya existe un perfil con ese nombre.');
      }
    }

    if (parsed.permisoIds) {
      await this.assertPermisosExist(parsed.permisoIds);
    }

    const perfilId = await this.dataSource.transaction(async (manager) => {
      if (parsed.nombre !== undefined) perfil.nombre = parsed.nombre.trim();
      if (parsed.descripcion !== undefined) perfil.descripcion = parsed.descripcion.trim() || undefined;
      if (parsed.estadoRegistro !== undefined) {
        perfil.estadoRegistro = parsed.estadoRegistro as EstadoRegistro;
      }

      await manager.save(perfil);

      if (parsed.permisoIds) {
        await manager.delete(PerfilPermiso, { perfilId: perfil.id });
        await manager.save(
          parsed.permisoIds.map((permisoId) =>
            manager.create(PerfilPermiso, { perfilId: perfil.id, permisoId }),
          ),
        );
      }

      return perfil.id;
    });

    return this.findById(perfilId);
  }

  parseListQuery(input: Record<string, unknown>): ListQuery {
    return parseListQuery(input);
  }

  private async findById(id: string): Promise<PerfilListItem> {
    const perfil = await this.perfilRepo.findOne({
      where: { id },
      relations: { permisos: true },
    });

    if (!perfil) {
      throw new NotFoundError('El perfil solicitado no existe.');
    }

    return this.toListItem(perfil);
  }

  private toListItem(perfil: Perfil): PerfilListItem {
    return {
      id: perfil.id,
      nombre: perfil.nombre,
      descripcion: perfil.descripcion,
      estadoRegistro: perfil.estadoRegistro,
      permisoIds: (perfil.permisos ?? []).map((pp) => pp.permisoId),
    };
  }

  private async assertPermisosExist(permisoIds: string[]): Promise<void> {
    const permisos = await this.permisoRepo.find({ where: { id: In(permisoIds) } });
    if (permisos.length !== permisoIds.length) {
      throw new NotFoundError('Uno o mas permisos no existen.');
    }
  }
}
