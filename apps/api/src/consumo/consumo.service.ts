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
  AnularConsumoAlimentoInput,
  CrearConsumoAlimentoInput,
} from '@gestion-granjas/shared/schemas/consumo.schemas';
import {
  anularConsumoAlimentoSchema,
  crearConsumoAlimentoSchema,
} from '@gestion-granjas/shared/schemas/consumo.schemas';
import type {
  ListQuery,
  PaginatedResponse,
} from '@gestion-granjas/shared/schemas/pagination.schemas';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  Alimento,
  Almacen,
  ConsumoAlimento,
  Granja,
  Lote,
  MovimientoInventario,
  TipoMovimientoInventario,
} from '@gestion-granjas/database/entities';
import { EstadoRegistro, SignoMovimiento } from '@gestion-granjas/database/enums';
import { DataSource, Repository } from 'typeorm';
import {
  assertAlmacenRequerido,
  assertCantidadConsumoValida,
  assertLoteActivoParaConsumo,
  assertLoteMismaGranja,
  assertStockSuficienteConsumo,
} from './consumo.rules';

@Injectable()
export class ConsumoService {
  constructor(
    @InjectRepository(ConsumoAlimento)
    private readonly consumoRepo: Repository<ConsumoAlimento>,
    @InjectRepository(Lote) private readonly loteRepo: Repository<Lote>,
    @InjectRepository(Granja) private readonly granjaRepo: Repository<Granja>,
    @InjectRepository(Alimento) private readonly alimentoRepo: Repository<Alimento>,
    @InjectRepository(Almacen) private readonly almacenRepo: Repository<Almacen>,
    @InjectRepository(TipoMovimientoInventario)
    private readonly tipoMovimientoRepo: Repository<TipoMovimientoInventario>,
    @InjectRepository(MovimientoInventario)
    private readonly movimientoRepo: Repository<MovimientoInventario>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async listar(
    ctx: TenantContext,
    query: ListQuery,
    granjaId?: string,
    loteId?: string,
    alimentoId?: string,
    incluirAnulados?: string,
  ): Promise<PaginatedResponse<ConsumoAlimento>> {
    requirePermission(ctx, PERMISOS.ALIMENTACION_CONSUMO_VER);

    const targetGranjaId = granjaId ?? ctx.granjaActivaId;
    if (!targetGranjaId) {
      return {
        items: [],
        meta: { page: query.page, limit: query.limit, total: 0, totalPages: 1 },
      };
    }

    await this.assertGranjaAccesible(ctx, targetGranjaId);

    const qb = this.consumoRepo
      .createQueryBuilder('consumo')
      .leftJoinAndSelect('consumo.lote', 'lote')
      .leftJoinAndSelect('consumo.alimento', 'alimento')
      .leftJoinAndSelect('consumo.almacen', 'almacen')
      .leftJoinAndSelect('consumo.unidadMedida', 'unidadMedida')
      .leftJoinAndSelect('consumo.movimientoInventario', 'movimientoInventario')
      .where('consumo.companiaId = :companiaId', { companiaId: ctx.companiaId })
      .andWhere('consumo.granjaId = :granjaId', { granjaId: targetGranjaId });

    if (loteId) {
      qb.andWhere('consumo.loteId = :loteId', { loteId });
    }
    if (alimentoId) {
      qb.andWhere('consumo.alimentoId = :alimentoId', { alimentoId });
    }
    if (incluirAnulados !== 'true') {
      qb.andWhere('consumo.anulado = false');
    }

    qb.orderBy('consumo.fecha', 'DESC').addOrderBy('consumo.createdAt', 'DESC');

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

  async crear(ctx: TenantContext, input: CrearConsumoAlimentoInput) {
    requirePermission(ctx, PERMISOS.ALIMENTACION_CONSUMO_CREAR);
    const parsed = crearConsumoAlimentoSchema.parse(input);
    assertCantidadConsumoValida(parsed.cantidad);
    assertAlmacenRequerido(parsed.almacenId);

    await this.assertGranjaAccesible(ctx, parsed.granjaId);

    const lote = await this.loteRepo.findOne({ where: { id: parsed.loteId } });
    if (!lote || lote.companiaId !== ctx.companiaId) {
      throw new NotFoundError('El lote solicitado no existe.');
    }
    assertLoteMismaGranja(lote.granjaId, parsed.granjaId);
    assertLoteActivoParaConsumo(lote);

    const alimento = await this.alimentoRepo.findOne({
      where: { id: parsed.alimentoId, companiaId: ctx.companiaId },
    });
    if (!alimento) {
      throw new NotFoundError('El alimento solicitado no existe.');
    }
    if (alimento.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('INVENTARIO_ALIMENTO_INACTIVO', 'El alimento esta inactivo.');
    }

    const almacen = await this.almacenRepo.findOne({
      where: { id: parsed.almacenId, companiaId: ctx.companiaId },
    });
    if (!almacen) {
      throw new NotFoundError('El almacen solicitado no existe.');
    }
    if (almacen.granjaId !== parsed.granjaId) {
      throw new BusinessRuleError(
        'INVENTARIO_TIPO_MOVIMIENTO_INVALIDO',
        'El almacen no pertenece a la granja indicada.',
      );
    }
    if (almacen.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('INVENTARIO_ALMACEN_INACTIVO', 'El almacen esta inactivo.');
    }

    const tipoMovimiento = await this.tipoMovimientoRepo.findOne({
      where: { codigo: 'SALIDA_CONSUMO', estadoRegistro: EstadoRegistro.ACTIVO },
    });
    if (!tipoMovimiento) {
      throw new BusinessRuleError(
        'INVENTARIO_TIPO_MOVIMIENTO_INVALIDO',
        'El tipo de movimiento de consumo no esta configurado.',
      );
    }

    const existencia = await this.calcularExistencia(
      ctx.companiaId,
      parsed.granjaId,
      parsed.almacenId,
      parsed.alimentoId,
    );
    assertStockSuficienteConsumo(existencia, parsed.cantidad);

    return this.dataSource.transaction(async (manager) => {
      const movimiento = await manager.save(
        manager.create(MovimientoInventario, {
          companiaId: ctx.companiaId,
          granjaId: parsed.granjaId,
          almacenId: parsed.almacenId,
          alimentoId: parsed.alimentoId,
          tipoMovimientoId: tipoMovimiento.id,
          fecha: parsed.fecha,
          cantidad: String(parsed.cantidad),
          unidadMedidaId: alimento.unidadMedidaId,
          observaciones: parsed.observaciones
            ? `Consumo lote ${lote.codigo}. ${parsed.observaciones}`
            : `Consumo lote ${lote.codigo}.`,
          anulado: false,
          createdById: ctx.userId,
        }),
      );

      const consumo = await manager.save(
        manager.create(ConsumoAlimento, {
          companiaId: ctx.companiaId,
          granjaId: parsed.granjaId,
          loteId: parsed.loteId,
          alimentoId: parsed.alimentoId,
          almacenId: parsed.almacenId,
          movimientoInventarioId: movimiento.id,
          fecha: parsed.fecha,
          cantidad: String(parsed.cantidad),
          unidadMedidaId: alimento.unidadMedidaId,
          observaciones: parsed.observaciones,
          anulado: false,
          createdById: ctx.userId,
        }),
      );

      return manager.findOne(ConsumoAlimento, {
        where: { id: consumo.id },
        relations: {
          lote: true,
          alimento: true,
          almacen: true,
          unidadMedida: true,
          movimientoInventario: true,
        },
      });
    });
  }

  async anular(ctx: TenantContext, id: string, input: AnularConsumoAlimentoInput) {
    requirePermission(ctx, PERMISOS.ALIMENTACION_CONSUMO_ANULAR);
    const parsed = anularConsumoAlimentoSchema.parse(input);

    const consumo = await this.consumoRepo.findOne({
      where: { id, companiaId: ctx.companiaId },
      relations: { movimientoInventario: true },
    });
    if (!consumo) {
      throw new NotFoundError('El consumo solicitado no existe.');
    }

    await this.assertGranjaAccesible(ctx, consumo.granjaId);

    if (consumo.anulado) {
      throw new ConflictError('CONSUMO_YA_ANULADO', 'El consumo ya fue anulado.');
    }

    return this.dataSource.transaction(async (manager) => {
      consumo.anulado = true;
      consumo.anuladoAt = new Date();
      consumo.anuladoById = ctx.userId;
      consumo.motivoAnulacion = parsed.motivoAnulacion;
      await manager.save(consumo);

      const movimiento = consumo.movimientoInventario;
      if (movimiento && !movimiento.anulado) {
        movimiento.anulado = true;
        movimiento.anuladoAt = new Date();
        movimiento.anuladoById = ctx.userId;
        movimiento.motivoAnulacion = parsed.motivoAnulacion;
        await manager.save(movimiento);
      }

      return manager.findOne(ConsumoAlimento, {
        where: { id: consumo.id },
        relations: {
          lote: true,
          alimento: true,
          almacen: true,
          unidadMedida: true,
          movimientoInventario: true,
        },
      });
    });
  }

  private async calcularExistencia(
    companiaId: string,
    granjaId: string,
    almacenId: string,
    alimentoId: string,
  ): Promise<number> {
    const result = await this.movimientoRepo
      .createQueryBuilder('movimiento')
      .innerJoin('movimiento.tipoMovimiento', 'tipoMovimiento')
      .select(
        `COALESCE(SUM(
          CASE WHEN tipoMovimiento.signo = :entrada THEN movimiento.cantidad::numeric
          ELSE -movimiento.cantidad::numeric END
        ), 0)`,
        'cantidad',
      )
      .where('movimiento.companiaId = :companiaId', { companiaId })
      .andWhere('movimiento.granjaId = :granjaId', { granjaId })
      .andWhere('movimiento.almacenId = :almacenId', { almacenId })
      .andWhere('movimiento.alimentoId = :alimentoId', { alimentoId })
      .andWhere('movimiento.anulado = false')
      .setParameter('entrada', SignoMovimiento.ENTRADA)
      .getRawOne<{ cantidad: string }>();

    return Number(result?.cantidad ?? 0);
  }

  private async assertGranjaAccesible(ctx: TenantContext, granjaId: string) {
    requireGranjaAccess(ctx, granjaId);
    const granja = await this.granjaRepo.findOne({ where: { id: granjaId } });
    if (!granja || granja.companiaId !== ctx.companiaId) {
      throw new NotFoundError('La granja solicitada no existe.');
    }
    if (granja.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('GRANJA_INACTIVA', 'La granja esta inactiva.');
    }
  }
}
