import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from '@gestion-granjas/shared/errors';
import {
  PERMISOS,
  requireGranjaAccess,
  requirePermission,
} from '@gestion-granjas/shared/permissions';
import type { TenantContext } from '@gestion-granjas/shared';
import type {
  AnularMovimientoUbicacionInput,
  CrearMovimientoUbicacionInput,
} from '@gestion-granjas/shared/schemas/movimientos-ubicacion.schemas';
import {
  anularMovimientoUbicacionSchema,
  crearMovimientoUbicacionSchema,
} from '@gestion-granjas/shared/schemas/movimientos-ubicacion.schemas';
import type {
  ListQuery,
  PaginatedResponse,
} from '@gestion-granjas/shared/schemas/pagination.schemas';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  Granja,
  Lote,
  MotivoMovimientoUbicacion,
  MovimientoUbicacion,
  Ubicacion,
} from '@gestion-granjas/database/entities';
import { EstadoRegistro } from '@gestion-granjas/database/enums';
import { DataSource, Repository } from 'typeorm';
import {
  assertDestinoDistinto,
  assertEsUltimoVigente,
  assertFechaMovimiento,
  assertLoteMovible,
} from './movimientos-ubicacion.rules';

@Injectable()
export class MovimientosUbicacionService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(MovimientoUbicacion)
    private readonly movimientoRepo: Repository<MovimientoUbicacion>,
    @InjectRepository(Lote) private readonly loteRepo: Repository<Lote>,
    @InjectRepository(Granja) private readonly granjaRepo: Repository<Granja>,
    @InjectRepository(Ubicacion) private readonly ubicacionRepo: Repository<Ubicacion>,
    @InjectRepository(MotivoMovimientoUbicacion)
    private readonly motivoRepo: Repository<MotivoMovimientoUbicacion>,
  ) {}

  async listar(
    ctx: TenantContext,
    query: ListQuery,
    granjaId?: string,
    loteId?: string,
    fechaDesde?: string,
    fechaHasta?: string,
    incluirAnulados?: string,
  ): Promise<PaginatedResponse<MovimientoUbicacion>> {
    requirePermission(ctx, PERMISOS.UBICACIONES_MOVIMIENTOS_VER);

    const targetGranjaId = granjaId ?? ctx.granjaActivaId;
    if (!targetGranjaId) {
      return {
        items: [],
        meta: { page: query.page, limit: query.limit, total: 0, totalPages: 1 },
      };
    }

    requireGranjaAccess(ctx, targetGranjaId);
    await this.assertGranjaTenant(ctx, targetGranjaId);

    const qb = this.movimientoRepo
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.lote', 'lote')
      .leftJoinAndSelect('movimiento.ubicacionOrigen', 'ubicacionOrigen')
      .leftJoinAndSelect('movimiento.ubicacionDestino', 'ubicacionDestino')
      .leftJoinAndSelect('movimiento.motivo', 'motivo')
      .where('movimiento.companiaId = :companiaId', { companiaId: ctx.companiaId })
      .andWhere('movimiento.granjaId = :granjaId', { granjaId: targetGranjaId });

    if (loteId) {
      qb.andWhere('movimiento.loteId = :loteId', { loteId });
    }
    if (fechaDesde) {
      qb.andWhere('movimiento.fecha >= :fechaDesde', { fechaDesde });
    }
    if (fechaHasta) {
      qb.andWhere('movimiento.fecha <= :fechaHasta', { fechaHasta });
    }
    if (incluirAnulados !== 'true') {
      qb.andWhere('movimiento.anulado = false');
    }

    qb.orderBy('movimiento.fecha', 'DESC').addOrderBy('movimiento.createdAt', 'DESC');

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await qb.skip(skip).take(query.limit).getManyAndCount();

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async crear(ctx: TenantContext, input: CrearMovimientoUbicacionInput) {
    requirePermission(ctx, PERMISOS.UBICACIONES_MOVIMIENTOS_CREAR);
    const parsed = crearMovimientoUbicacionSchema.parse(input);
    requireGranjaAccess(ctx, parsed.granjaId);
    await this.assertGranjaActiva(ctx, parsed.granjaId);

    return this.dataSource.transaction(async (manager) => {
      const loteRepo = manager.getRepository(Lote);
      const movimientoRepo = manager.getRepository(MovimientoUbicacion);
      const ubicacionRepo = manager.getRepository(Ubicacion);
      const motivoRepo = manager.getRepository(MotivoMovimientoUbicacion);

      const lote = await loteRepo.findOne({
        where: {
          id: parsed.loteId,
          granjaId: parsed.granjaId,
          companiaId: ctx.companiaId,
        },
      });
      if (!lote) {
        throw new NotFoundError('El lote indicado no existe.');
      }
      assertLoteMovible(lote);

      const destino = await ubicacionRepo.findOne({
        where: { id: parsed.ubicacionDestinoId, granjaId: parsed.granjaId },
      });
      if (!destino) {
        throw new BusinessRuleError(
          'MOV_UBICACION_DESTINO_INVALIDO',
          'La ubicacion destino no pertenece a la granja.',
        );
      }
      if (destino.estadoRegistro !== EstadoRegistro.ACTIVO) {
        throw new ConflictError(
          'MOV_UBICACION_ENTIDAD_INACTIVA',
          'La ubicacion destino esta inactiva.',
        );
      }

      assertDestinoDistinto(lote.ubicacionId, parsed.ubicacionDestinoId);

      const motivo = await motivoRepo.findOne({
        where: { id: parsed.motivoId, companiaId: ctx.companiaId },
      });
      if (!motivo || motivo.estadoRegistro !== EstadoRegistro.ACTIVO) {
        throw new BusinessRuleError(
          'MOV_UBICACION_MOTIVO_INVALIDO',
          'Seleccione un motivo de movimiento activo.',
        );
      }

      const ultimoVigente = await this.findUltimoVigente(movimientoRepo, lote.id);
      assertFechaMovimiento({
        fecha: parsed.fecha,
        fechaInicioLote: lote.fechaInicio,
        fechaUltimoVigente: ultimoVigente?.fecha,
      });

      const movimiento = await movimientoRepo.save(
        movimientoRepo.create({
          companiaId: ctx.companiaId,
          granjaId: parsed.granjaId,
          loteId: lote.id,
          ubicacionOrigenId: lote.ubicacionId,
          ubicacionDestinoId: destino.id,
          motivoId: motivo.id,
          fecha: parsed.fecha,
          observaciones: parsed.observaciones,
          anulado: false,
          createdById: ctx.userId,
        }),
      );

      lote.ubicacionId = destino.id;
      lote.updatedById = ctx.userId;
      await loteRepo.save(lote);

      return movimientoRepo.findOneOrFail({
        where: { id: movimiento.id },
        relations: {
          lote: true,
          ubicacionOrigen: true,
          ubicacionDestino: true,
          motivo: true,
        },
      });
    });
  }

  async anular(ctx: TenantContext, id: string, input: AnularMovimientoUbicacionInput) {
    requirePermission(ctx, PERMISOS.UBICACIONES_MOVIMIENTOS_ANULAR);
    const parsed = anularMovimientoUbicacionSchema.parse(input);

    return this.dataSource.transaction(async (manager) => {
      const movimientoRepo = manager.getRepository(MovimientoUbicacion);
      const loteRepo = manager.getRepository(Lote);

      const movimiento = await movimientoRepo.findOne({
        where: { id, companiaId: ctx.companiaId },
        relations: { lote: true },
      });
      if (!movimiento) {
        throw new NotFoundError('El movimiento indicado no existe.');
      }
      requireGranjaAccess(ctx, movimiento.granjaId);

      if (movimiento.anulado) {
        throw new ConflictError(
          'MOV_UBICACION_YA_ANULADO',
          'El movimiento ya fue anulado.',
        );
      }

      const ultimoVigente = await this.findUltimoVigente(movimientoRepo, movimiento.loteId);
      assertEsUltimoVigente(movimiento, ultimoVigente);

      const lote = await loteRepo.findOne({ where: { id: movimiento.loteId } });
      if (!lote) {
        throw new NotFoundError('El lote indicado no existe.');
      }

      const anterior = await movimientoRepo
        .createQueryBuilder('movimiento')
        .where('movimiento.loteId = :loteId', { loteId: movimiento.loteId })
        .andWhere('movimiento.anulado = false')
        .andWhere('movimiento.id != :id', { id: movimiento.id })
        .orderBy('movimiento.fecha', 'DESC')
        .addOrderBy('movimiento.createdAt', 'DESC')
        .getOne();

      movimiento.anulado = true;
      movimiento.anuladoAt = new Date();
      movimiento.anuladoById = ctx.userId;
      movimiento.motivoAnulacion = parsed.motivo;
      await movimientoRepo.save(movimiento);

      lote.ubicacionId = anterior?.ubicacionDestinoId ?? lote.ubicacionInicialId;
      lote.updatedById = ctx.userId;
      await loteRepo.save(lote);

      return movimientoRepo.findOneOrFail({
        where: { id: movimiento.id },
        relations: {
          lote: true,
          ubicacionOrigen: true,
          ubicacionDestino: true,
          motivo: true,
        },
      });
    });
  }

  private async findUltimoVigente(
    repo: Repository<MovimientoUbicacion>,
    loteId: string,
  ) {
    return repo
      .createQueryBuilder('movimiento')
      .where('movimiento.loteId = :loteId', { loteId })
      .andWhere('movimiento.anulado = false')
      .orderBy('movimiento.fecha', 'DESC')
      .addOrderBy('movimiento.createdAt', 'DESC')
      .getOne();
  }

  private async assertGranjaTenant(ctx: TenantContext, granjaId: string) {
    const granja = await this.granjaRepo.findOne({ where: { id: granjaId } });
    if (!granja || granja.companiaId !== ctx.companiaId) {
      throw new NotFoundError('La granja solicitada no existe.');
    }
  }

  private async assertGranjaActiva(ctx: TenantContext, granjaId: string) {
    await this.assertGranjaTenant(ctx, granjaId);
    const granja = await this.granjaRepo.findOne({ where: { id: granjaId } });
    if (!granja || granja.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('GRANJA_INACTIVA', 'La granja esta inactiva.');
    }
  }
}
