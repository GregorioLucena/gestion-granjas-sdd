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
  DatoFaltanteConversion,
  ReporteEngordePeriodoFilters,
  ReporteEngordeResponse,
} from '@gestion-granjas/shared/schemas/reportes-engorde.schemas';
import {
  FORMULAS_REPORTE_ENGORDE,
  reporteEngordeLoteQuerySchema,
  reporteEngordePeriodoFiltersSchema,
} from '@gestion-granjas/shared/schemas/reportes-engorde.schemas';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BajaEngorde,
  CierreEngorde,
  ConsumoAlimento,
  ControlPeso,
  EngordeLote,
  Granja,
  Lote,
  TipoAnimal,
} from '@gestion-granjas/database/entities';
import { EstadoEngorde, EstadoRegistro, MomentoControlPeso } from '@gestion-granjas/database/enums';
import { In, Repository } from 'typeorm';
import { calcularCantidadActual } from '../engorde/engorde.rules';
import {
  assertPeriodoReporte,
  calcularConversionAlimenticia,
  calcularMortalidad,
  diasEntre,
  engordeSolapaPeriodo,
  gananciaPromedioKg,
  gananciaTotalEstimadaKg,
  round2,
} from './reportes-engorde.rules';

type ControlesInfo = {
  pesoInicial: number | null;
  pesoFinal: number | null;
  ultimoPeso: number | null;
  controles: Array<{
    id: string;
    fecha: string;
    momento: string;
    pesoPromedioKg: number;
  }>;
};

@Injectable()
export class ReportesEngordeService {
  constructor(
    @InjectRepository(EngordeLote)
    private readonly engordeRepo: Repository<EngordeLote>,
    @InjectRepository(CierreEngorde)
    private readonly cierreRepo: Repository<CierreEngorde>,
    @InjectRepository(BajaEngorde)
    private readonly bajaRepo: Repository<BajaEngorde>,
    @InjectRepository(ControlPeso)
    private readonly controlRepo: Repository<ControlPeso>,
    @InjectRepository(ConsumoAlimento)
    private readonly consumoRepo: Repository<ConsumoAlimento>,
    @InjectRepository(Granja) private readonly granjaRepo: Repository<Granja>,
    @InjectRepository(Lote) private readonly loteRepo: Repository<Lote>,
    @InjectRepository(TipoAnimal)
    private readonly tipoAnimalRepo: Repository<TipoAnimal>,
  ) {}

  async enCurso(ctx: TenantContext, query: Record<string, unknown>) {
    requirePermission(ctx, PERMISOS.REPORTES_ENGORDE_VER);
    const filters = reporteEngordePeriodoFiltersSchema.parse(query);
    await this.assertContexto(ctx, filters);
    assertPeriodoReporte(filters.fechaDesde, filters.fechaHasta);

    const engordes = await this.loadEngordesPeriodo(ctx, filters, EstadoEngorde.EN_CURSO);
    const fechaConsulta = new Date().toISOString().slice(0, 10);
    const data = [];

    for (const engorde of engordes) {
      const row = await this.buildIndicadores(engorde, fechaConsulta, false);
      data.push({
        engordeId: engorde.id,
        loteId: engorde.loteId,
        loteCodigo: engorde.lote?.codigo ?? '',
        granjaId: engorde.granjaId,
        granjaNombre: engorde.granja?.nombre ?? '',
        fechaInicio: engorde.fechaInicio,
        duracionDias: row.duracionDias,
        cantidadInicial: engorde.cantidadInicial,
        cantidadActual: row.cantidadActual,
        pesoInicialPromedioKg: row.pesoInicial,
        ultimoPesoPromedioKg: row.ultimoPeso,
        gananciaHastaUltimoControlKg: row.gananciaHastaUltimo,
        etiquetaGanancia:
          row.gananciaHastaUltimo === null
            ? null
            : 'Ganancia hasta el ultimo control',
        consumoAcumuladoKg: row.consumoAcumuladoKg,
        objetivoPesoKg: engorde.objetivoPesoKg != null ? Number(engorde.objetivoPesoKg) : null,
        avanceObjetivoPct: row.avanceObjetivoPct,
      });
    }

    const pageData = this.paginate(data, filters.page, filters.limit);
    return this.envelope(pageData.items, {
      total: data.length,
      cantidadAnimalesActual: round2(
        data.reduce((sum, row) => sum + row.cantidadActual, 0),
      ),
      consumoAcumuladoKg: round2(
        data.reduce((sum, row) => sum + row.consumoAcumuladoKg, 0),
      ),
    }, filters, {
      page: filters.page,
      limit: filters.limit,
      total: data.length,
      totalPages: pageData.totalPages,
    });
  }

  async cerrados(ctx: TenantContext, query: Record<string, unknown>) {
    requirePermission(ctx, PERMISOS.REPORTES_ENGORDE_VER);
    const filters = reporteEngordePeriodoFiltersSchema.parse(query);
    await this.assertContexto(ctx, filters);
    assertPeriodoReporte(filters.fechaDesde, filters.fechaHasta);

    const engordes = await this.loadEngordesPeriodo(ctx, filters, EstadoEngorde.CERRADO);
    const fechaConsulta = new Date().toISOString().slice(0, 10);
    const data = [];

    for (const engorde of engordes) {
      const row = await this.buildIndicadores(engorde, fechaConsulta, true);
      data.push({
        engordeId: engorde.id,
        loteId: engorde.loteId,
        loteCodigo: engorde.lote?.codigo ?? '',
        fechaInicio: engorde.fechaInicio,
        fechaCierre: row.fechaCierre,
        duracionDias: row.duracionDias,
        cantidadInicial: engorde.cantidadInicial,
        cantidadFinal: row.cantidadFinal,
        pesoInicialPromedioKg: row.pesoInicial,
        pesoFinalPromedioKg: row.pesoFinal,
        gananciaPromedioKg: row.gananciaPromedio,
        gananciaTotalEstimadaKg: row.gananciaTotalEstimada,
        consumoAcumuladoKg: row.consumoAcumuladoKg,
        bajasMortalidad: row.bajasMortalidad,
        otrasBajas: row.otrasBajas,
        mortalidadPct: row.mortalidadPct,
        conversionAlimenticia: row.conversionAlimenticia,
        datosFaltantes: row.datosFaltantes,
        motivoCierre: row.motivoCierre,
      });
    }

    const pageData = this.paginate(data, filters.page, filters.limit);
    return this.envelope(pageData.items, {
      total: data.length,
      mortalidadAnimales: data.reduce((sum, row) => sum + row.bajasMortalidad, 0),
      consumoAcumuladoKg: round2(
        data.reduce((sum, row) => sum + row.consumoAcumuladoKg, 0),
      ),
      conversionDisponible: data.filter((row) => row.conversionAlimenticia !== null).length,
    }, filters, {
      page: filters.page,
      limit: filters.limit,
      total: data.length,
      totalPages: pageData.totalPages,
    });
  }

  async bajas(ctx: TenantContext, query: Record<string, unknown>) {
    requirePermission(ctx, PERMISOS.REPORTES_ENGORDE_VER);
    const filters = reporteEngordePeriodoFiltersSchema.parse(query);
    await this.assertContexto(ctx, filters);
    assertPeriodoReporte(filters.fechaDesde, filters.fechaHasta);

    const qb = this.bajaRepo
      .createQueryBuilder('baja')
      .leftJoinAndSelect('baja.motivo', 'motivo')
      .leftJoinAndSelect('baja.lote', 'lote')
      .leftJoinAndSelect('baja.engorde', 'engorde')
      .where('baja.companiaId = :companiaId', { companiaId: ctx.companiaId })
      .andWhere('baja.granjaId = :granjaId', { granjaId: filters.granjaId })
      .andWhere('baja.anulado = false')
      .andWhere('baja.fecha >= :fechaDesde', { fechaDesde: filters.fechaDesde })
      .andWhere('baja.fecha <= :fechaHasta', { fechaHasta: filters.fechaHasta })
      .andWhere('engorde.estado != :anulado', { anulado: EstadoEngorde.ANULADO })
      .orderBy('baja.fecha', 'DESC')
      .addOrderBy('baja.createdAt', 'DESC');

    if (filters.loteId) {
      qb.andWhere('baja.loteId = :loteId', { loteId: filters.loteId });
    }
    if (filters.tipoAnimalId) {
      qb.andWhere('lote.tipoAnimalId = :tipoAnimalId', {
        tipoAnimalId: filters.tipoAnimalId,
      });
    }

    const bajas = await qb.getMany();
    const data = bajas.map((baja) => ({
      id: baja.id,
      fecha: baja.fecha,
      loteId: baja.loteId,
      loteCodigo: baja.lote?.codigo ?? '',
      engordeId: baja.engordeId,
      cantidad: baja.cantidad,
      motivo: baja.motivo?.nombre ?? '',
      cuentaComoMortalidad: Boolean(baja.motivo?.cuentaComoMortalidad),
      observaciones: baja.observaciones ?? null,
    }));

    const bajasMortalidad = data
      .filter((row) => row.cuentaComoMortalidad)
      .reduce((sum, row) => sum + row.cantidad, 0);
    const otrasBajas = data
      .filter((row) => !row.cuentaComoMortalidad)
      .reduce((sum, row) => sum + row.cantidad, 0);

    const engordeIds = [...new Set(data.map((row) => row.engordeId))];
    let cantidadInicialBase = 0;
    if (engordeIds.length > 0) {
      const engordes = await this.engordeRepo.find({
        where: { id: In(engordeIds) },
        select: ['id', 'cantidadInicial'],
      });
      cantidadInicialBase = engordes.reduce((sum, item) => sum + item.cantidadInicial, 0);
    }

    const pageData = this.paginate(data, filters.page, filters.limit);
    return this.envelope(pageData.items, {
      bajasMortalidad,
      otrasBajas,
      totalBajas: bajasMortalidad + otrasBajas,
      mortalidadPct:
        cantidadInicialBase > 0
          ? round2((bajasMortalidad / cantidadInicialBase) * 100)
          : null,
      notaMortalidadPct:
        'Porcentaje calculado sobre la suma de cantidadInicial de los engordes con bajas en el periodo.',
    }, filters, {
      page: filters.page,
      limit: filters.limit,
      total: data.length,
      totalPages: pageData.totalPages,
    });
  }

  async resumenLote(
    ctx: TenantContext,
    loteId: string,
    query: Record<string, unknown>,
  ) {
    requirePermission(ctx, PERMISOS.REPORTES_ENGORDE_VER);
    const filters = reporteEngordeLoteQuerySchema.parse(query);
    await this.assertContexto(ctx, { ...filters, loteId });

    const lote = await this.loteRepo.findOne({
      where: { id: loteId },
      relations: { tipoAnimal: true, finalidadProductiva: true, granja: true },
    });
    if (!lote || lote.companiaId !== ctx.companiaId || lote.granjaId !== filters.granjaId) {
      throw new NotFoundError('El lote solicitado no existe.');
    }

    const engordesLote = await this.engordeRepo.find({
      where: {
        loteId,
        granjaId: filters.granjaId,
        companiaId: ctx.companiaId,
      },
      relations: { lote: true, granja: true },
      order: { fechaInicio: 'DESC', createdAt: 'DESC' },
    });
    const engorde =
      engordesLote.find((item) => item.estado !== EstadoEngorde.ANULADO) ?? null;

    if (!engorde) {
      return this.envelope(
        {
          lote: {
            id: lote.id,
            codigo: lote.codigo,
            tipoAnimal: lote.tipoAnimal?.nombre ?? '',
            finalidad: lote.finalidadProductiva?.nombre ?? '',
          },
          engorde: null,
          controles: [],
          bajas: [],
          consumosPorAlimento: [],
          cierre: null,
          indicadores: null,
        },
        { tieneEngorde: false },
        { granjaId: filters.granjaId, loteId },
        { datosFaltantes: [] },
      );
    }

    const fechaConsulta = new Date().toISOString().slice(0, 10);
    const cerrado = engorde.estado === EstadoEngorde.CERRADO;
    const row = await this.buildIndicadores(engorde, fechaConsulta, cerrado);
    const controles = await this.loadControles(engorde.id);
    const bajas = await this.bajaRepo.find({
      where: { engordeId: engorde.id, anulado: false },
      relations: { motivo: true },
      order: { fecha: 'ASC', createdAt: 'ASC' },
    });
    const consumosPorAlimento = await this.consumoAgregadoPorAlimento(
      engorde.loteId,
      engorde.fechaInicio,
      row.fechaFinEfectiva,
    );

    const data = {
      lote: {
        id: lote.id,
        codigo: lote.codigo,
        tipoAnimal: lote.tipoAnimal?.nombre ?? '',
        finalidad: lote.finalidadProductiva?.nombre ?? '',
      },
      engorde: {
        id: engorde.id,
        estado: engorde.estado,
        fechaInicio: engorde.fechaInicio,
        cantidadInicial: engorde.cantidadInicial,
        objetivoPesoKg:
          engorde.objetivoPesoKg != null ? Number(engorde.objetivoPesoKg) : null,
      },
      controles: controles.controles,
      bajas: bajas.map((baja) => ({
        id: baja.id,
        fecha: baja.fecha,
        cantidad: baja.cantidad,
        motivo: baja.motivo?.nombre ?? '',
        cuentaComoMortalidad: Boolean(baja.motivo?.cuentaComoMortalidad),
      })),
      consumosPorAlimento,
      cierre: row.fechaCierre
        ? {
            fechaCierre: row.fechaCierre,
            cantidadFinal: row.cantidadFinal,
            motivoCierre: row.motivoCierre,
          }
        : null,
      indicadores: {
        cantidadActual: row.cantidadActual,
        duracionDias: row.duracionDias,
        pesoInicialPromedioKg: row.pesoInicial,
        pesoFinalPromedioKg: row.pesoFinal,
        ultimoPesoPromedioKg: row.ultimoPeso,
        gananciaPromedioKg: row.gananciaPromedio,
        gananciaHastaUltimoControlKg: row.gananciaHastaUltimo,
        gananciaTotalEstimadaKg: row.gananciaTotalEstimada,
        consumoAcumuladoKg: row.consumoAcumuladoKg,
        conversionAlimenticia: row.conversionAlimenticia,
        bajasMortalidad: row.bajasMortalidad,
        otrasBajas: row.otrasBajas,
        mortalidadPct: row.mortalidadPct,
      },
    };

    return this.envelope(
      data,
      {
        estado: engorde.estado,
        conversionAlimenticia: row.conversionAlimenticia,
        mortalidadPct: row.mortalidadPct,
      },
      { granjaId: filters.granjaId, loteId },
      { datosFaltantes: row.datosFaltantes },
    );
  }

  private async buildIndicadores(
    engorde: EngordeLote,
    fechaConsulta: string,
    cerrado: boolean,
  ) {
    const [bajas, cierres, controles] = await Promise.all([
      this.bajaRepo.find({
        where: { engordeId: engorde.id },
        relations: { motivo: true },
      }),
      this.cierreRepo.find({
        where: { engordeId: engorde.id },
        relations: { motivoCierre: true },
        order: { fechaCierre: 'DESC', createdAt: 'DESC' },
      }),
      this.loadControles(engorde.id),
    ]);

    const cierreVigente = cierres.find((item) => !item.anulado) ?? null;
    const fechaFinEfectiva = cierreVigente?.fechaCierre ?? fechaConsulta;
    const consumoReal = await this.sumConsumo(
      engorde.loteId,
      engorde.fechaInicio,
      fechaFinEfectiva,
    );

    const cantidadActual = calcularCantidadActual(engorde.cantidadInicial, bajas);
    const mortalidad = calcularMortalidad(
      engorde.cantidadInicial,
      bajas.map((baja) => ({
        cantidad: baja.cantidad,
        anulado: baja.anulado,
        cuentaComoMortalidad: Boolean(baja.motivo?.cuentaComoMortalidad),
      })),
    );

    const gananciaPromedio = gananciaPromedioKg(controles.pesoInicial, controles.pesoFinal);
    const gananciaHastaUltimo = gananciaPromedioKg(
      controles.pesoInicial,
      controles.ultimoPeso,
    );
    const cantidadFinal = cierreVigente?.cantidadFinal ?? null;
    const gananciaTotal = cerrado
      ? gananciaTotalEstimadaKg(gananciaPromedio, cantidadFinal)
      : null;

    let conversionAlimenticia: number | null = null;
    let datosFaltantes: DatoFaltanteConversion[] = [];
    if (cerrado) {
      const conversion = calcularConversionAlimenticia({
        pesoInicial: controles.pesoInicial,
        pesoFinal: controles.pesoFinal,
        cantidadFinal,
        consumoAcumuladoKg: consumoReal,
      });
      conversionAlimenticia =
        conversion.conversionAlimenticia === null
          ? null
          : round2(conversion.conversionAlimenticia);
      datosFaltantes = conversion.datosFaltantes;
    }

    let avanceObjetivoPct: number | null = null;
    if (
      engorde.objetivoPesoKg != null &&
      controles.pesoInicial !== null &&
      controles.ultimoPeso !== null
    ) {
      const objetivo = Number(engorde.objetivoPesoKg);
      const denom = objetivo - controles.pesoInicial;
      if (denom > 0) {
        avanceObjetivoPct = round2(
          ((controles.ultimoPeso - controles.pesoInicial) / denom) * 100,
        );
      }
    }

    return {
      cantidadActual,
      fechaCierre: cierreVigente?.fechaCierre ?? null,
      fechaFinEfectiva,
      duracionDias: diasEntre(engorde.fechaInicio, fechaFinEfectiva),
      cantidadFinal,
      pesoInicial: controles.pesoInicial === null ? null : round2(controles.pesoInicial),
      pesoFinal: controles.pesoFinal === null ? null : round2(controles.pesoFinal),
      ultimoPeso: controles.ultimoPeso === null ? null : round2(controles.ultimoPeso),
      gananciaPromedio: gananciaPromedio === null ? null : round2(gananciaPromedio),
      gananciaHastaUltimo:
        gananciaHastaUltimo === null ? null : round2(gananciaHastaUltimo),
      gananciaTotalEstimada: gananciaTotal === null ? null : round2(gananciaTotal),
      consumoAcumuladoKg: round2(consumoReal),
      bajasMortalidad: mortalidad.bajasMortalidad,
      otrasBajas: mortalidad.otrasBajas,
      mortalidadPct:
        mortalidad.mortalidadPct === null ? null : round2(mortalidad.mortalidadPct),
      conversionAlimenticia,
      datosFaltantes,
      motivoCierre: cierreVigente?.motivoCierre?.nombre ?? null,
      avanceObjetivoPct,
    };
  }

  private async loadControles(engordeId: string): Promise<ControlesInfo> {
    const controles = await this.controlRepo.find({
      where: { engordeId, anulado: false },
      order: { fecha: 'ASC', createdAt: 'ASC' },
    });
    const pesoInicial =
      controles.find((item) => item.momento === MomentoControlPeso.INICIAL) ?? null;
    const pesoFinal =
      controles.find((item) => item.momento === MomentoControlPeso.FINAL) ?? null;
    const ultimo = controles.at(-1) ?? null;
    return {
      pesoInicial: pesoInicial ? Number(pesoInicial.pesoPromedioKg) : null,
      pesoFinal: pesoFinal ? Number(pesoFinal.pesoPromedioKg) : null,
      ultimoPeso: ultimo ? Number(ultimo.pesoPromedioKg) : null,
      controles: controles.map((item) => ({
        id: item.id,
        fecha: item.fecha,
        momento: item.momento,
        pesoPromedioKg: round2(Number(item.pesoPromedioKg)),
      })),
    };
  }

  private async sumConsumo(loteId: string, desde: string, hasta?: string) {
    if (!hasta) return 0;
    const rows = await this.consumoRepo
      .createQueryBuilder('consumo')
      .select('COALESCE(SUM(consumo.cantidad::numeric), 0)', 'total')
      .where('consumo.loteId = :loteId', { loteId })
      .andWhere('consumo.anulado = false')
      .andWhere('consumo.fecha >= :desde', { desde })
      .andWhere('consumo.fecha <= :hasta', { hasta })
      .getRawOne<{ total: string }>();
    return Number(rows?.total ?? 0);
  }

  private async consumoAgregadoPorAlimento(
    loteId: string,
    desde: string,
    hasta: string,
  ) {
    const rows = await this.consumoRepo
      .createQueryBuilder('consumo')
      .leftJoin('consumo.alimento', 'alimento')
      .select('consumo.alimentoId', 'alimentoId')
      .addSelect('alimento.nombre', 'alimentoNombre')
      .addSelect('COALESCE(SUM(consumo.cantidad::numeric), 0)', 'cantidadKg')
      .where('consumo.loteId = :loteId', { loteId })
      .andWhere('consumo.anulado = false')
      .andWhere('consumo.fecha >= :desde', { desde })
      .andWhere('consumo.fecha <= :hasta', { hasta })
      .groupBy('consumo.alimentoId')
      .addGroupBy('alimento.nombre')
      .getRawMany<{ alimentoId: string; alimentoNombre: string; cantidadKg: string }>();

    return rows.map((row) => ({
      alimentoId: row.alimentoId,
      alimentoNombre: row.alimentoNombre ?? '',
      cantidadKg: round2(Number(row.cantidadKg)),
    }));
  }

  private async loadEngordesPeriodo(
    ctx: TenantContext,
    filters: ReporteEngordePeriodoFilters,
    estado: EstadoEngorde,
  ) {
    const qb = this.engordeRepo
      .createQueryBuilder('engorde')
      .leftJoinAndSelect('engorde.lote', 'lote')
      .leftJoinAndSelect('engorde.granja', 'granja')
      .where('engorde.companiaId = :companiaId', { companiaId: ctx.companiaId })
      .andWhere('engorde.granjaId = :granjaId', { granjaId: filters.granjaId })
      .andWhere('engorde.estado = :estado', { estado })
      .orderBy('engorde.fechaInicio', 'DESC');

    if (filters.loteId) {
      qb.andWhere('engorde.loteId = :loteId', { loteId: filters.loteId });
    }
    if (filters.tipoAnimalId) {
      qb.andWhere('lote.tipoAnimalId = :tipoAnimalId', {
        tipoAnimalId: filters.tipoAnimalId,
      });
    }

    const engordes = await qb.getMany();
    const cierres = engordes.length
      ? await this.cierreRepo.find({
          where: { engordeId: In(engordes.map((item) => item.id)), anulado: false },
        })
      : [];
    const cierreMap = new Map(cierres.map((item) => [item.engordeId, item.fechaCierre]));

    return engordes.filter((engorde) =>
      engordeSolapaPeriodo(
        engorde.fechaInicio,
        cierreMap.get(engorde.id) ?? null,
        filters.fechaDesde,
        filters.fechaHasta,
      ),
    );
  }

  private paginate<T>(items: T[], page: number, limit: number) {
    const totalPages = Math.max(1, Math.ceil(items.length / limit) || 1);
    const start = (page - 1) * limit;
    return {
      items: items.slice(start, start + limit),
      totalPages,
    };
  }

  private envelope<TData, TSummary>(
    data: TData,
    summary: TSummary,
    filters: Record<string, unknown>,
    extraMeta: Partial<ReporteEngordeResponse<TData, TSummary>['meta']> = {},
  ): ReporteEngordeResponse<TData, TSummary> {
    const periodo =
      typeof filters.fechaDesde === 'string' && typeof filters.fechaHasta === 'string'
        ? { desde: filters.fechaDesde, hasta: filters.fechaHasta }
        : undefined;

    return {
      data,
      summary,
      meta: {
        periodo,
        filtros: this.filtrosMeta(filters),
        fechaConsulta: new Date().toISOString(),
        formulas: FORMULAS_REPORTE_ENGORDE,
        ...extraMeta,
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
    filters: { granjaId: string; loteId?: string; tipoAnimalId?: string },
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

    if (filters.tipoAnimalId) {
      const tipo = await this.tipoAnimalRepo.findOne({
        where: { id: filters.tipoAnimalId },
      });
      if (!tipo || tipo.companiaId !== ctx.companiaId) {
        throw new BusinessRuleError(
          'REPORTE_FILTRO_INVALIDO',
          'Uno de los filtros no pertenece a la granja seleccionada.',
        );
      }
    }
  }
}
