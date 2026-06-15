import { AppError, ForbiddenError, NotFoundError } from '@gestion-granjas/shared/errors';
import type { AuthUserResponse, LoginInput, LoginResponse } from '@gestion-granjas/shared/schemas/seguridad.schemas';
import {
  granjaActivaSchema,
  loginSchema,
} from '@gestion-granjas/shared/schemas/seguridad.schemas';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session, Usuario } from '@gestion-granjas/database/entities';
import { EstadoUsuario } from '@gestion-granjas/database/enums';
import { requireGranjaAccess } from '@gestion-granjas/shared/permissions';
import type { TenantContext } from '@gestion-granjas/shared';
import {
  buildAuthFromUsuario,
  normalizeEmail,
  resolveGranjaActivaId,
  type JwtPayload,
} from './auth.utils';
import {
  generateRefreshToken,
  getAccessTokenTtl,
  getRefreshExpiresAt,
  hashToken,
  verifyPassword,
} from './auth.crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginInput): Promise<{ result: LoginResponse; refreshToken: string }> {
    const parsed = loginSchema.parse(input);
    const email = normalizeEmail(parsed.email);

    const usuario = await this.usuarioRepo.findOne({
      where: { email },
      relations: {
        granjas: { granja: true },
        perfiles: { perfil: { permisos: { permiso: true } } },
      },
    });

    if (!usuario || !(await verifyPassword(parsed.password, usuario.passwordHash))) {
      throw new AppError('AUTH_INVALID_CREDENTIALS', 'Correo o contrasena incorrectos.', 401);
    }

    if (usuario.estado === EstadoUsuario.INACTIVO) {
      throw new ForbiddenError('AUTH_USER_INACTIVE', 'Su usuario esta inactivo. Contacte al administrador.');
    }

    if (usuario.estado === EstadoUsuario.BLOQUEADO) {
      throw new ForbiddenError('AUTH_USER_BLOCKED', 'Su usuario esta bloqueado. Contacte al administrador.');
    }

    const { permisos, granjaIds } = buildAuthFromUsuario(usuario);

    if (granjaIds.length === 0) {
      throw new ForbiddenError('USUARIO_SIN_GRANJA', 'El usuario debe tener acceso a al menos una granja.');
    }

    if (permisos.length === 0) {
      throw new ForbiddenError('USUARIO_SIN_PERFIL', 'El usuario debe tener al menos un perfil activo.');
    }

    const refreshToken = generateRefreshToken();
    const session = await this.sessionRepo.save(
      this.sessionRepo.create({
        sessionToken: hashToken(refreshToken),
        userId: usuario.id,
        expires: getRefreshExpiresAt(),
      }),
    );

    const granjaActivaId = resolveGranjaActivaId(granjaIds);
    const accessToken = this.signAccessToken({
      userId: usuario.id,
      companiaId: usuario.companiaId,
      granjaIds,
      permisos,
      granjaActivaId,
      sessionId: session.id,
    });

    return {
      result: {
        accessToken,
        user: this.toAuthUserResponse(usuario, granjaIds, permisos, granjaActivaId),
      },
      refreshToken,
    };
  }

  async refresh(refreshToken: string | undefined): Promise<{ result: LoginResponse; refreshToken: string }> {
    if (!refreshToken) {
      throw new AppError('AUTH_REFRESH_INVALID', 'Sesion no valida. Vuelva a iniciar sesion.', 401);
    }

    const session = await this.sessionRepo.findOne({
      where: { sessionToken: hashToken(refreshToken) },
    });

    if (!session || session.expires.getTime() <= Date.now()) {
      if (session) {
        await this.sessionRepo.delete(session.id);
      }
      throw new AppError('AUTH_REFRESH_INVALID', 'Sesion no valida. Vuelva a iniciar sesion.', 401);
    }

    const usuario = await this.loadUsuario(session.userId);

    if (usuario.estado !== EstadoUsuario.ACTIVO) {
      await this.sessionRepo.delete(session.id);
      throw new ForbiddenError(
        usuario.estado === EstadoUsuario.BLOQUEADO ? 'AUTH_USER_BLOCKED' : 'AUTH_USER_INACTIVE',
        usuario.estado === EstadoUsuario.BLOQUEADO
          ? 'Su usuario esta bloqueado. Contacte al administrador.'
          : 'Su usuario esta inactivo. Contacte al administrador.',
      );
    }

    const { permisos, granjaIds } = buildAuthFromUsuario(usuario);
    const granjaActivaId = resolveGranjaActivaId(granjaIds);

    await this.sessionRepo.delete(session.id);
    const newRefreshToken = generateRefreshToken();
    const newSession = await this.sessionRepo.save(
      this.sessionRepo.create({
        sessionToken: hashToken(newRefreshToken),
        userId: usuario.id,
        expires: getRefreshExpiresAt(),
      }),
    );

    const accessToken = this.signAccessToken({
      userId: usuario.id,
      companiaId: usuario.companiaId,
      granjaIds,
      permisos,
      granjaActivaId,
      sessionId: newSession.id,
    });

    return {
      result: {
        accessToken,
        user: this.toAuthUserResponse(usuario, granjaIds, permisos, granjaActivaId),
      },
      refreshToken: newRefreshToken,
    };
  }

  async logout(ctx: TenantContext, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.sessionRepo.delete({ sessionToken: hashToken(refreshToken) });
    }

    if (ctx.sessionId) {
      await this.sessionRepo.delete(ctx.sessionId);
    }
  }

  async setGranjaActiva(ctx: TenantContext, input: unknown): Promise<LoginResponse> {
    const parsed = granjaActivaSchema.parse(input);
    requireGranjaAccess(ctx, parsed.granjaId);

    const usuario = await this.loadUsuario(ctx.userId);
    const { permisos, granjaIds } = buildAuthFromUsuario(usuario);

    const accessToken = this.signAccessToken({
      userId: ctx.userId,
      companiaId: ctx.companiaId,
      granjaIds,
      permisos,
      granjaActivaId: parsed.granjaId,
      sessionId: ctx.sessionId ?? '',
    });

    return {
      accessToken,
      user: this.toAuthUserResponse(usuario, granjaIds, permisos, parsed.granjaId),
    };
  }

  async revokeUserSessions(userId: string): Promise<void> {
    await this.sessionRepo.delete({ userId });
  }

  private signAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign({ ...payload }, { expiresIn: 900 });
  }

  private async loadUsuario(userId: string): Promise<Usuario> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: userId },
      relations: {
        granjas: { granja: true },
        perfiles: { perfil: { permisos: { permiso: true } } },
      },
    });

    if (!usuario) {
      throw new NotFoundError('El usuario solicitado no existe.');
    }

    return usuario;
  }

  private toAuthUserResponse(
    usuario: Usuario,
    granjaIds: string[],
    permisos: string[],
    granjaActivaId?: string,
  ): AuthUserResponse {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      companiaId: usuario.companiaId,
      estado: usuario.estado,
      granjaIds,
      granjaActivaId,
      permisos,
    };
  }
}
