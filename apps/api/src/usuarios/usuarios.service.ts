import {
  ConflictError,
  NotFoundError,
} from '@gestion-granjas/shared/errors';
import { PERMISOS, requirePermission } from '@gestion-granjas/shared/permissions';
import type { TenantContext } from '@gestion-granjas/shared';
import type {
  ActualizarUsuarioInput,
  CrearUsuarioInput,
  RestablecerContrasenaInput,
  UsuarioListQuery,
} from '@gestion-granjas/shared/schemas/seguridad.schemas';
import {
  actualizarUsuarioSchema,
  crearUsuarioSchema,
  restablecerContrasenaSchema,
  usuarioListQuerySchema,
} from '@gestion-granjas/shared/schemas/seguridad.schemas';
import type { PaginatedResponse } from '@gestion-granjas/shared/schemas/pagination.schemas';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  Compania,
  Granja,
  Perfil,
  Usuario,
  UsuarioGranja,
  UsuarioPerfil,
} from '@gestion-granjas/database/entities';
import { EstadoUsuario } from '@gestion-granjas/database/enums';
import { normalizeEmail } from '../auth/auth.utils';
import { hashPassword } from '../auth/auth.crypto';
import { AuthService } from '../auth/auth.service';
import {
  assertGranjasBelongToCompania,
  assertPerfilesActivos,
  assertUsuarioScope,
  canManageAllUsers,
} from './usuarios.rules';

type UsuarioListItem = {
  id: string;
  nombre: string;
  apellido?: string | null;
  email: string;
  companiaId: string;
  companiaNombre?: string;
  estado: Usuario['estado'];
  granjaIds: string[];
  perfilIds: string[];
};

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Compania) private readonly companiaRepo: Repository<Compania>,
    @InjectRepository(Granja) private readonly granjaRepo: Repository<Granja>,
    @InjectRepository(Perfil) private readonly perfilRepo: Repository<Perfil>,
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
  ) {}

  parseListQuery(input: Record<string, unknown>): UsuarioListQuery {
    return usuarioListQuerySchema.parse(input);
  }

  async listar(ctx: TenantContext, query: UsuarioListQuery): Promise<PaginatedResponse<UsuarioListItem>> {
    requirePermission(ctx, PERMISOS.USUARIOS_VER);

    const qb = this.usuarioRepo
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.granjas', 'usuarioGranja')
      .leftJoinAndSelect('usuario.perfiles', 'usuarioPerfil')
      .leftJoin(Compania, 'compania', 'compania.id = usuario.companiaId');

    if (!canManageAllUsers(ctx)) {
      qb.andWhere('usuario.companiaId = :companiaId', { companiaId: ctx.companiaId });
    }

    if (query.search) {
      qb.andWhere(
        '(usuario.nombre ILIKE :search OR usuario.apellido ILIKE :search OR usuario.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.estado !== 'TODOS') {
      qb.andWhere('usuario.estado = :estado', { estado: query.estado });
    }

    qb.orderBy('usuario.nombre', 'ASC').addOrderBy('usuario.apellido', 'ASC');

    const skip = (query.page - 1) * query.limit;
    const [usuarios, total] = await qb.skip(skip).take(query.limit).getManyAndCount();

    const companiaIds = [...new Set(usuarios.map((u) => u.companiaId))];
    const companias = companiaIds.length
      ? await this.companiaRepo.find({ where: { id: In(companiaIds) } })
      : [];
    const companiaMap = new Map(companias.map((c) => [c.id, c.nombre]));

    return {
      items: usuarios.map((usuario) => this.toListItem(usuario, companiaMap.get(usuario.companiaId))),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async crear(ctx: TenantContext, input: CrearUsuarioInput) {
    requirePermission(ctx, PERMISOS.USUARIOS_CREAR);
    const parsed = crearUsuarioSchema.parse(input);

    assertUsuarioScope(ctx, parsed.companiaId);
    await assertGranjasBelongToCompania(parsed.granjaIds, parsed.companiaId, this.granjaRepo);
    await assertPerfilesActivos(parsed.perfilIds, this.perfilRepo);

    const email = normalizeEmail(parsed.email);
    const exists = await this.usuarioRepo.findOne({ where: { email } });
    if (exists) {
      throw new ConflictError('USUARIO_EMAIL_DUPLICADO', 'Ya existe un usuario con ese correo.');
    }

    const usuarioId = await this.dataSource.transaction(async (manager) => {
      const usuario = await manager.save(
        manager.create(Usuario, {
          companiaId: parsed.companiaId,
          nombre: parsed.nombre.trim(),
          apellido: parsed.apellido?.trim() || undefined,
          email,
          passwordHash: await hashPassword(parsed.password),
          estado: parsed.estado as EstadoUsuario,
        }),
      );

      await manager.save(
        parsed.granjaIds.map((granjaId) =>
          manager.create(UsuarioGranja, { usuarioId: usuario.id, granjaId }),
        ),
      );

      await manager.save(
        parsed.perfilIds.map((perfilId) =>
          manager.create(UsuarioPerfil, { usuarioId: usuario.id, perfilId }),
        ),
      );

      return usuario.id;
    });

    return this.findById(ctx, usuarioId);
  }

  async actualizar(ctx: TenantContext, id: string, input: ActualizarUsuarioInput) {
    requirePermission(ctx, PERMISOS.USUARIOS_EDITAR);
    const parsed = actualizarUsuarioSchema.parse(input);
    const usuario = await this.findEntity(ctx, id);

    if (parsed.granjaIds) {
      await assertGranjasBelongToCompania(parsed.granjaIds, usuario.companiaId, this.granjaRepo);
    }

    if (parsed.perfilIds) {
      await assertPerfilesActivos(parsed.perfilIds, this.perfilRepo);
    }

    const usuarioId = await this.dataSource.transaction(async (manager) => {
      if (parsed.nombre !== undefined) usuario.nombre = parsed.nombre.trim();
      if (parsed.apellido !== undefined) usuario.apellido = parsed.apellido.trim() || undefined;
      if (parsed.estado !== undefined) usuario.estado = parsed.estado as EstadoUsuario;

      await manager.save(usuario);

      if (parsed.granjaIds) {
        await manager.delete(UsuarioGranja, { usuarioId: usuario.id });
        await manager.save(
          parsed.granjaIds.map((granjaId) =>
            manager.create(UsuarioGranja, { usuarioId: usuario.id, granjaId }),
          ),
        );
      }

      if (parsed.perfilIds) {
        await manager.delete(UsuarioPerfil, { usuarioId: usuario.id });
        await manager.save(
          parsed.perfilIds.map((perfilId) =>
            manager.create(UsuarioPerfil, { usuarioId: usuario.id, perfilId }),
          ),
        );
      }

      if (parsed.estado && parsed.estado !== 'ACTIVO') {
        await this.authService.revokeUserSessions(usuario.id);
      }

      return usuario.id;
    });

    return this.findById(ctx, usuarioId);
  }

  async restablecerContrasena(ctx: TenantContext, id: string, input: RestablecerContrasenaInput) {
    requirePermission(ctx, PERMISOS.USUARIOS_EDITAR);
    const parsed = restablecerContrasenaSchema.parse(input);
    const usuario = await this.findEntity(ctx, id);

    usuario.passwordHash = await hashPassword(parsed.password);
    await this.usuarioRepo.save(usuario);
    await this.authService.revokeUserSessions(usuario.id);

    return { ok: true };
  }

  private async findEntity(ctx: TenantContext, id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepo.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundError('El usuario solicitado no existe.');
    }

    assertUsuarioScope(ctx, usuario.companiaId);
    return usuario;
  }

  private async findById(ctx: TenantContext, id: string): Promise<UsuarioListItem> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id },
      relations: { granjas: true, perfiles: true },
    });

    if (!usuario) {
      throw new NotFoundError('El usuario solicitado no existe.');
    }

    assertUsuarioScope(ctx, usuario.companiaId);
    const compania = await this.companiaRepo.findOne({ where: { id: usuario.companiaId } });
    return this.toListItem(usuario, compania?.nombre);
  }

  private toListItem(usuario: Usuario, companiaNombre?: string): UsuarioListItem {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      companiaId: usuario.companiaId,
      companiaNombre,
      estado: usuario.estado,
      granjaIds: (usuario.granjas ?? []).map((ug) => ug.granjaId),
      perfilIds: (usuario.perfiles ?? []).map((up) => up.perfilId),
    };
  }
}
