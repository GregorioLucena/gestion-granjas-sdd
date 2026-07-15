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
  ReporteAlimentacionPeriodoFilters,
  ReporteExistenciasFilters,
  ReporteMovimientosFilters,
  ReporteResponse,
} from '@gestion-granjas/shared/schemas/reportes-alimentacion.schemas';
import {
  reporteAlimentacionPeriodoFiltersSchema,
  reporteExistenciasFiltersSchema,
  reporteMovimientosFiltersSchema,
} from '@gestion-granjas/shared/schemas/reportes-alimentacion.schemas';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
import { In, Repository } from 'typeorm';
import {
  assertPeriodoReporte,
  assertUnidadKg,
  calcularCoberturaCosto,
  costoDesdeMovimiento,
  emptyCantidadSummary,
  round4,
} from './reportes-alimentacion.rules';

type ConsumoAgregadoLote = {
  loteId: string;
  loteCodigo: string;
  alimentoId: string;
  alimentoNombre: string;
  almacenId: string;
  almacenNombre: string;
  cantidadKg: number;
  costoConocido: number;
  cantidadConCosto: number;
  cantidadSinCosto: number;
  coberturaCostoPct: number | null;
  etiquetaCosto: string;
};

type ConsumoAgregadoAlimento = {
  alimentoId: string;
  alimentoNombre: string;
  cantidadKg: number;
  cantidadLotes: number;
  costoConocido: number;
  cantidadConCosto: number;
  cantidadSinCosto: number;
  coberturaCostoPct: number | null;
  etiquetaCosto: string;
};

type ExistenciaRow = {
  granjaId: string;
  almacenId: string;
  almacenNombre: string;
  alimentoId: string;
  alimentoNombre: string;
  existencia: number;
  unidadCodigo: string;
  unidadAbreviatura: string;
  costoReferencia: number | null;
};

type ResumenMovimientos = {
  entradas: number;
  salidasManuales: number;
  salidasConsumo: number;
  ajustesPositivos: number;
  ajustesNegativos: number;
  unidad: string;
};

@Injectable()
export class ReportesAlimentacionService {
  constructor(
    @InjectRepository(ConsumoAlimento)
    private readonly consumoRepo: Repository<ConsumoAlimento>,
    @InjectRepository(MovimientoInventario)
    private readonly movimientoRepo: Repository<MovimientoInventario>,
    @InjectRepository(Granja) private readonly granjaRepo: Repository<Granja>,
    @InjectRepository(Lote) private readonly loteRepo: Repository<Lote>,
    @InjectRepository(Alimento) private readonly alimentoRepo: Repository<Alimento>,
    @InjectRepository(Almacen) private readonly almacenRepo: Repository<Almacen>,
    @InjectRepository(TipoMovimientoInventario)
    private readonly tipoMovimientoRepo: Repository<TipoMovimientoInventario>,
  ) {}

  async consumoPorLotes(
    ctx: TenantContext,
    query: Record<string, unknown>,
  ): Promise<ReporteResponse<ConsumoAgregadoLote[]>> {
    requirePermission(ctx, PERMISOS.REPORTES_ALIMENTACION_VER);
    const filters = reporteAlimentacionPeriodoFiltersSchema.parse(query);
    await this.assertContexto(ctx, filters);
    assertPeriodoReporte(filters.fechaDesde, filters.fechaHasta);

    const consumos = await this.loadConsumosPeriodo(ctx, filters);
    const groups = new Map<string, ConsumoAgregadoLote & { _conCosto: number; _sinCosto: number; _costo: number }>();

    for (const consumo of consumos) {
      assertUnidadKg(consumo.unidadMedida?.codigo);
      const cantidad = Number(consumo.cantidad);
      const costo = costoDesdeMovimiento(
        cantidad,
        consumo.movimientoInventario?.costoUnitario,
      );
      const key = `${consumo.loteId}:${consumo.alimentoId}:${consumo.almacenId}`;
      const current = groups.get(key) ?? {
        loteId: consumo.loteId,
        loteCodigo: consumo.lote?.codigo ?? '',
        alimentoId: consumo.alimentoId,
        alimentoNombre: consumo.alimento?.nombre ?? '',
        almacenId: consumo.almacenId,
        almacenNombre: consumo.almacen?.nombre ?? '',
        cantidadKg: 0,
        costoConocido: 0,
        cantidadConCosto: 0,
        cantidadSinCosto: 0,
        coberturaCostoPct: null,
        etiquetaCosto: 'Sin costo',
        _conCosto: 0,
        _sinCosto: 0,
        _costo: 0,
      };
      current.cantidadKg += cantidad;
      if (costo === null) {
        current._sinCosto += cantidad;
      } else {
        current._conCosto += cantidad;
        current._costo += costo;
      }
      groups.set(key, current);
    }

    const data = [...groups.values()].map((row) => {
      const cobertura = calcularCoberturaCosto(row.cantidadKg, row._conCosto, row._costo);
      return {
        loteId: row.loteId,
        loteCodigo: row.loteCodigo,
        alimentoId: row.alimentoId,
        alimentoNombre: row.alimentoNombre,
        almacenId: row.almacenId,
        almacenNombre: row.almacenNombre,
        cantidadKg: round4(row.cantidadKg),
        ...cobertura,
      };
    });

    return this.buildCantidadResponse(data, filters, this.aggregateCobertura(data));
  }

  async consumoPorAlimentos(
    ctx: TenantContext,
    query: Record<string, unknown>,
  ): Promise<ReporteResponse<ConsumoAgregadoAlimento[]>> {
    requirePermission(ctx, PERMISOS.REPORTES_ALIMENTACION_VER);
    const filters = reporteAlimentacionPeriodoFiltersSchema.parse(query);
    await this.assertContexto(ctx, filters);
    assertPeriodoReporte(filters.fechaDesde, filters.fechaHasta);

    const consumos = await this.loadConsumosPeriodo(ctx, filters);
    const groups = new Map<
      string,
      ConsumoAgregadoAlimento & { _lotes: Set<string>; _conCosto: number; _costo: number }
    >();

    for (const consumo of consumos) {
      assertUnidadKg(consumo.unidadMedida?.codigo);
      const cantidad = Number(consumo.cantidad);
      const costo = costoDesdeMovimiento(
        cantidad,
        consumo.movimientoInventario?.costoUnitario,
      );
      const current = groups.get(consumo.alimentoId) ?? {
        alimentoId: consumo.alimentoId,
        alimentoNombre: consumo.alimento?.nombre ?? '',
        cantidadKg: 0,
        cantidadLotes: 0,
        costoConocido: 0,
        cantidadConCosto: 0,
        cantidadSinCosto: 0,
        coberturaCostoPct: null,
        etiquetaCosto: 'Sin costo',
        _lotes: new Set<string>(),
        _conCosto: 0,
        _costo: 0,
      };
      current.cantidadKg += cantidad;
      current._lotes.add(consumo.loteId);
      if (costo !== null) {
        current._conCosto += cantidad;
        current._costo += costo;
      }
      groups.set(consumo.alimentoId, current);
    }

    const data = [...groups.values()].map((row) => {
      const cobertura = calcularCoberturaCosto(row.cantidadKg, row._conCosto, row._costo);
      return {
        alimentoId: row.alimentoId,
        alimentoNombre: row.alimentoNombre,
        cantidadKg: round4(row.cantidadKg),
        cantidadLotes: row._lotes.size,
        ...cobertura,
      };
    });

    return this.buildCantidadResponse(data, filters, this.aggregateCobertura(data));
  }

  async existencias(
    ctx: TenantContext,
    query: Record<string, unknown>,
  ): Promise<
    ReporteResponse<
      ExistenciaRow[],
      { cantidadTotal: number; unidad: string; filas: number }
    >
  > {
    requirePermission(ctx, PERMISOS.REPORTES_ALIMENTACION_VER);
    const filters = reporteExistenciasFiltersSchema.parse(query);
    await this.assertContexto(ctx, filters);

    const qb = this.movimientoRepo
      .createQueryBuilder('movimiento')
      .innerJoin('movimiento.tipoMovimiento', 'tipoMovimiento')
      .select('movimiento.granjaId', 'granjaId')
      .addSelect('movimiento.almacenId', 'almacenId')
      .addSelect('movimiento.alimentoId', 'alimentoId')
      .addSelect(
        `COALESCE(SUM(
          CASE WHEN tipoMovimiento.signo = :entrada THEN movimiento.cantidad::numeric
          ELSE -movimiento.cantidad::numeric END
        ), 0)`,
        'cantidad',
      )
      .where('movimiento.companiaId = :companiaId', { companiaId: ctx.companiaId })
      .andWhere('movimiento.granjaId = :granjaId', { granjaId: filters.granjaId })
      .andWhere('movimiento.anulado = false')
      .setParameter('entrada', SignoMovimiento.ENTRADA)
      .groupBy('movimiento.granjaId')
      .addGroupBy('movimiento.almacenId')
      .addGroupBy('movimiento.alimentoId');

    if (filters.almacenId) {
      qb.andWhere('movimiento.almacenId = :almacenId', { almacenId: filters.almacenId });
    }
    if (filters.alimentoId) {
      qb.andWhere('movimiento.alimentoId = :alimentoId', { alimentoId: filters.alimentoId });
    }

    const rows = await qb.getRawMany<{
      granjaId: string;
      almacenId: string;
      alimentoId: string;
      cantidad: string;
    }>();

    if (rows.length === 0) {
      return {
        data: [],
        summary: { cantidadTotal: 0, unidad: 'kg', filas: 0 },
        meta: {
          filtros: this.filtrosMeta(filters),
          fechaConsulta: new Date().toISOString(),
        },
      };
    }

    const [almacenes, alimentos] = await Promise.all([
      this.almacenRepo.find({ where: { id: In([...new Set(rows.map((r) => r.almacenId))]) } }),
      this.alimentoRepo.find({
        where: { id: In([...new Set(rows.map((r) => r.alimentoId))]) },
        relations: { unidadMedida: true },
      }),
    ]);
    const almacenMap = new Map(almacenes.map((a) => [a.id, a]));
    const alimentoMap = new Map(alimentos.map((a) => [a.id, a]));

    const data: ExistenciaRow[] = [];
    let cantidadTotal = 0;
    for (const row of rows) {
      const cantidad = Number(row.cantidad);
      if (cantidad === 0) continue;
      const alimento = alimentoMap.get(row.alimentoId);
      const almacen = almacenMap.get(row.almacenId);
      assertUnidadKg(alimento?.unidadMedida?.codigo);
      cantidadTotal += cantidad;
      data.push({
        granjaId: row.granjaId,
        almacenId: row.almacenId,
        almacenNombre: almacen?.nombre ?? '',
        alimentoId: row.alimentoId,
        alimentoNombre: alimento?.nombre ?? '',
        existencia: round4(cantidad),
        unidadCodigo: alimento?.unidadMedida?.codigo ?? 'KG',
        unidadAbreviatura: alimento?.unidadMedida?.abreviatura ?? 'kg',
        costoReferencia: alimento?.costoReferencia != null ? Number(alimento.costoReferencia) : null,
      });
    }

    return {
      data,
      summary: { cantidadTotal: round4(cantidadTotal), unidad: 'kg', filas: data.length },
      meta: {
        filtros: this.filtrosMeta(filters),
        fechaConsulta: new Date().toISOString(),
      },
    };
  }

  async movimientos(
    ctx: TenantContext,
    query: Record<string, unknown>,
  ): Promise<ReporteResponse<MovimientoInventario[]>> {
    requirePermission(ctx, PERMISOS.REPORTES_ALIMENTACION_VER);
    const filters = reporteMovimientosFiltersSchema.parse(query);
    await this.assertContexto(ctx, filters);
    assertPeriodoReporte(filters.fechaDesde, filters.fechaHasta);

    const qb = this.movimientoRepo
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.tipoMovimiento', 'tipoMovimiento')
      .leftJoinAndSelect('movimiento.alimento', 'alimento')
      .leftJoinAndSelect('movimiento.almacen', 'almacen')
      .leftJoinAndSelect('movimiento.unidadMedida', 'unidadMedida')
      .leftJoinAndSelect('movimiento.proveedor', 'proveedor')
      .where('movimiento.companiaId = :companiaId', { companiaId: ctx.companiaId })
      .andWhere('movimiento.granjaId = :granjaId', { granjaId: filters.granjaId })
      .andWhere('movimiento.anulado = false')
      .andWhere('movimiento.fecha >= :fechaDesde', { fechaDesde: filters.fechaDesde })
      .andWhere('movimiento.fecha <= :fechaHasta', { fechaHasta: filters.fechaHasta });

    if (filters.alimentoId) {
      qb.andWhere('movimiento.alimentoId = :alimentoId', { alimentoId: filters.alimentoId });
    }
    if (filters.almacenId) {
      qb.andWhere('movimiento.almacenId = :almacenId', { almacenId: filters.almacenId });
    }
    if (filters.tipoMovimientoId) {
      qb.andWhere('movimiento.tipoMovimientoId = :tipoMovimientoId', {
        tipoMovimientoId: filters.tipoMovimientoId,
      });
    }

    qb.orderBy('movimiento.fecha', 'DESC').addOrderBy('movimiento.createdAt', 'DESC');

    const skip = (filters.page - 1) * filters.limit;
    const [items, total] = await qb.skip(skip).take(filters.limit).getManyAndCount();

    let cantidadTotalKg = 0;
    let cantidadConCosto = 0;
    let costoConocido = 0;
    for (const item of items) {
      assertUnidadKg(item.unidadMedida?.codigo);
      const cantidad = Number(item.cantidad);
      cantidadTotalKg += cantidad;
      const costo = costoDesdeMovimiento(cantidad, item.costoUnitario);
      if (costo !== null) {
        cantidadConCosto += cantidad;
        costoConocido += costo;
      }
    }

    return {
      data: items,
      summary: {
        cantidadTotalKg: round4(cantidadTotalKg),
        unidad: 'kg',
        ...calcularCoberturaCosto(cantidadTotalKg, cantidadConCosto, costoConocido),
      },
      meta: {
        periodo: { desde: filters.fechaDesde, hasta: filters.fechaHasta },
        filtros: this.filtrosMeta(filters),
        fechaConsulta: new Date().toISOString(),
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / filters.limit)),
      },
    };
  }

  async resumenMovimientos(
    ctx: TenantContext,
    query: Record<string, unknown>,
  ): Promise<ReporteResponse<ResumenMovimientos, ResumenMovimientos>> {
    requirePermission(ctx, PERMISOS.REPORTES_ALIMENTACION_VER);
    const filters = reporteAlimentacionPeriodoFiltersSchema.parse(query);
    await this.assertContexto(ctx, filters);
    assertPeriodoReporte(filters.fechaDesde, filters.fechaHasta);

    const qb = this.movimientoRepo
      .createQueryBuilder('movimiento')
      .innerJoin('movimiento.tipoMovimiento', 'tipoMovimiento')
      .innerJoin('movimiento.unidadMedida', 'unidadMedida')
      .select('tipoMovimiento.codigo', 'codigo')
      .addSelect('unidadMedida.codigo', 'unidadCodigo')
      .addSelect('COALESCE(SUM(movimiento.cantidad::numeric), 0)', 'cantidad')
      .where('movimiento.companiaId = :companiaId', { companiaId: ctx.companiaId })
      .andWhere('movimiento.granjaId = :granjaId', { granjaId: filters.granjaId })
      .andWhere('movimiento.anulado = false')
      .andWhere('movimiento.fecha >= :fechaDesde', { fechaDesde: filters.fechaDesde })
      .andWhere('movimiento.fecha <= :fechaHasta', { fechaHasta: filters.fechaHasta })
      .groupBy('tipoMovimiento.codigo')
      .addGroupBy('unidadMedida.codigo');

    if (filters.alimentoId) {
      qb.andWhere('movimiento.alimentoId = :alimentoId', { alimentoId: filters.alimentoId });
    }
    if (filters.almacenId) {
      qb.andWhere('movimiento.almacenId = :almacenId', { almacenId: filters.almacenId });
    }

    const rows = await qb.getRawMany<{ codigo: string; unidadCodigo: string; cantidad: string }>();
    for (const row of rows) {
      assertUnidadKg(row.unidadCodigo);
    }

    const resumen: ResumenMovimientos = {
      entradas: 0,
      salidasManuales: 0,
      salidasConsumo: 0,
      ajustesPositivos: 0,
      ajustesNegativos: 0,
      unidad: 'kg',
    };

    for (const row of rows) {
      const cantidad = Number(row.cantidad);
      switch (row.codigo) {
        case 'ENTRADA_COMPRA':
        case 'ENTRADA_MANUAL':
          resumen.entradas += cantidad;
          break;
        case 'SALIDA_MANUAL':
          resumen.salidasManuales += cantidad;
          break;
        case 'SALIDA_CONSUMO':
          resumen.salidasConsumo += cantidad;
          break;
        case 'AJUSTE_POSITIVO':
          resumen.ajustesPositivos += cantidad;
          break;
        case 'AJUSTE_NEGATIVO':
          resumen.ajustesNegativos += cantidad;
          break;
        default:
          break;
      }
    }

    resumen.entradas = round4(resumen.entradas);
    resumen.salidasManuales = round4(resumen.salidasManuales);
    resumen.salidasConsumo = round4(resumen.salidasConsumo);
    resumen.ajustesPositivos = round4(resumen.ajustesPositivos);
    resumen.ajustesNegativos = round4(resumen.ajustesNegativos);

    return {
      data: resumen,
      summary: resumen,
      meta: {
        periodo: { desde: filters.fechaDesde, hasta: filters.fechaHasta },
        filtros: this.filtrosMeta(filters),
        fechaConsulta: new Date().toISOString(),
      },
    };
  }

  private async loadConsumosPeriodo(
    ctx: TenantContext,
    filters: ReporteAlimentacionPeriodoFilters,
  ) {
    const qb = this.consumoRepo
      .createQueryBuilder('consumo')
      .leftJoinAndSelect('consumo.lote', 'lote')
      .leftJoinAndSelect('consumo.alimento', 'alimento')
      .leftJoinAndSelect('consumo.almacen', 'almacen')
      .leftJoinAndSelect('consumo.unidadMedida', 'unidadMedida')
      .leftJoinAndSelect('consumo.movimientoInventario', 'movimientoInventario')
      .where('consumo.companiaId = :companiaId', { companiaId: ctx.companiaId })
      .andWhere('consumo.granjaId = :granjaId', { granjaId: filters.granjaId })
      .andWhere('consumo.anulado = false')
      .andWhere('consumo.fecha >= :fechaDesde', { fechaDesde: filters.fechaDesde })
      .andWhere('consumo.fecha <= :fechaHasta', { fechaHasta: filters.fechaHasta });

    if (filters.loteId) {
      qb.andWhere('consumo.loteId = :loteId', { loteId: filters.loteId });
    }
    if (filters.alimentoId) {
      qb.andWhere('consumo.alimentoId = :alimentoId', { alimentoId: filters.alimentoId });
    }
    if (filters.almacenId) {
      qb.andWhere('consumo.almacenId = :almacenId', { almacenId: filters.almacenId });
    }

    return qb.getMany();
  }

  private aggregateCobertura(
    rows: Array<{
      cantidadKg: number;
      cantidadConCosto: number;
      costoConocido: number;
    }>,
  ) {
    if (rows.length === 0) {
      return emptyCantidadSummary();
    }
    const cantidadTotalKg = rows.reduce((sum, row) => sum + row.cantidadKg, 0);
    const cantidadConCosto = rows.reduce((sum, row) => sum + row.cantidadConCosto, 0);
    const costoConocido = rows.reduce((sum, row) => sum + row.costoConocido, 0);
    return {
      cantidadTotalKg: round4(cantidadTotalKg),
      unidad: 'kg',
      ...calcularCoberturaCosto(cantidadTotalKg, cantidadConCosto, costoConocido),
    };
  }

  private buildCantidadResponse<T>(
    data: T[],
    filters: ReporteAlimentacionPeriodoFilters,
    summary: ReturnType<typeof emptyCantidadSummary>,
  ): ReporteResponse<T[]> {
    return {
      data,
      summary,
      meta: {
        periodo: { desde: filters.fechaDesde, hasta: filters.fechaHasta },
        filtros: this.filtrosMeta(filters),
        fechaConsulta: new Date().toISOString(),
      },
    };
  }

  private filtrosMeta(filters: Record<string, unknown>) {
    const meta: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;
      meta[key] = String(value);
    }
    return meta;
  }

  private async assertContexto(
    ctx: TenantContext,
    filters: { granjaId: string; loteId?: string; alimentoId?: string; almacenId?: string },
  ) {
    if (!filters.granjaId) {
      throw new BusinessRuleError(
        'REPORTE_GRANJA_REQUERIDA',
        'Debe seleccionar una granja para el reporte.',
      );
    }
    requireGranjaAccess(ctx, filters.granjaId);
    const granja = await this.granjaRepo.findOne({ where: { id: filters.granjaId } });
    if (!granja || granja.companiaId !== ctx.companiaId) {
      throw new NotFoundError('La granja solicitada no existe.');
    }
    if (granja.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('GRANJA_INACTIVA', 'La granja esta inactiva.');
    }

    if (filters.loteId) {
      const lote = await this.loteRepo.findOne({ where: { id: filters.loteId } });
      if (!lote || lote.companiaId !== ctx.companiaId || lote.granjaId !== filters.granjaId) {
        throw new BusinessRuleError(
          'REPORTE_FILTRO_INVALIDO',
          'Uno de los filtros no pertenece a la granja seleccionada.',
        );
      }
    }
    if (filters.alimentoId) {
      const alimento = await this.alimentoRepo.findOne({ where: { id: filters.alimentoId } });
      if (!alimento || alimento.companiaId !== ctx.companiaId) {
        throw new BusinessRuleError(
          'REPORTE_FILTRO_INVALIDO',
          'Uno de los filtros no pertenece a la granja seleccionada.',
        );
      }
    }
    if (filters.almacenId) {
      const almacen = await this.almacenRepo.findOne({ where: { id: filters.almacenId } });
      if (
        !almacen ||
        almacen.companiaId !== ctx.companiaId ||
        almacen.granjaId !== filters.granjaId
      ) {
        throw new BusinessRuleError(
          'REPORTE_FILTRO_INVALIDO',
          'Uno de los filtros no pertenece a la granja seleccionada.',
        );
      }
    }
  }
}
