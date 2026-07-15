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
  AnularEngordeInput,
  CerrarEngordeInput,
  CrearBajaEngordeInput,
  IniciarEngordeInput,
} from '@gestion-granjas/shared/schemas/engorde.schemas';
import {
  anularEngordeSchema,
  cerrarEngordeSchema,
  crearBajaEngordeSchema,
  iniciarEngordeSchema,
} from '@gestion-granjas/shared/schemas/engorde.schemas';
import type {
  ListQuery,
  PaginatedResponse,
} from '@gestion-granjas/shared/schemas/pagination.schemas';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  BajaEngorde,
  CierreEngorde,
  ConsumoAlimento,
  ControlPeso,
  EngordeLote,
  Granja,
  Lote,
  MetodoPesaje,
  MotivoBajaEngorde,
  MotivoCierreEngorde,
  UnidadMedida,
} from '@gestion-granjas/database/entities';
import {
  EstadoEngorde,
  EstadoLote,
  EstadoRegistro,
  ModalidadControlPeso,
  MomentoControlPeso,
  OrigenControlPeso,
} from '@gestion-granjas/database/enums';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';
import {
  assertBajaNoExcedeCantidad,
  assertCantidadBajaValida,
  assertCantidadFinalValida,
  assertFechaBaja,
  assertFechaCierre,
  assertFechaInicioEngorde,
  assertMuestraPeso,
  assertObjetivoPesoValido,
  assertPesoFinalAplicabilidad,
  calcularCantidadActual,
} from './engorde.rules';

type PesoInput = {
  pesoPromedioKg: number;
  modalidad: ModalidadControlPeso;
  metodoPesajeId: string;
  cantidadMuestra?: number;
};

@Injectable()
export class EngordeService {
  constructor(
    @InjectRepository(EngordeLote)
    private readonly engordeRepo: Repository<EngordeLote>,
    @InjectRepository(BajaEngorde)
    private readonly bajaRepo: Repository<BajaEngorde>,
    @InjectRepository(CierreEngorde)
    private readonly cierreRepo: Repository<CierreEngorde>,
    @InjectRepository(ControlPeso)
    private readonly controlPesoRepo: Repository<ControlPeso>,
    @InjectRepository(ConsumoAlimento)
    private readonly consumoRepo: Repository<ConsumoAlimento>,
    @InjectRepository(Lote) private readonly loteRepo: Repository<Lote>,
    @InjectRepository(Granja) private readonly granjaRepo: Repository<Granja>,
    @InjectRepository(MotivoBajaEngorde)
    private readonly motivoBajaRepo: Repository<MotivoBajaEngorde>,
    @InjectRepository(MotivoCierreEngorde)
    private readonly motivoCierreRepo: Repository<MotivoCierreEngorde>,
    @InjectRepository(MetodoPesaje)
    private readonly metodoPesajeRepo: Repository<MetodoPesaje>,
    @InjectRepository(UnidadMedida)
    private readonly unidadRepo: Repository<UnidadMedida>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async listar(
    ctx: TenantContext,
    query: ListQuery,
    granjaId?: string,
    loteId?: string,
    estado?: string,
    incluirAnulados?: string,
  ): Promise<PaginatedResponse<EngordeLote & { cantidadActual: number }>> {
    requirePermission(ctx, PERMISOS.ENGORDE_VER);

    const targetGranjaId = granjaId ?? ctx.granjaActivaId;
    if (!targetGranjaId) {
      return {
        items: [],
        meta: { page: query.page, limit: query.limit, total: 0, totalPages: 1 },
      };
    }

    await this.assertGranjaAccesible(ctx, targetGranjaId);

    const qb = this.engordeRepo
      .createQueryBuilder('engorde')
      .leftJoinAndSelect('engorde.lote', 'lote')
      .leftJoinAndSelect('lote.finalidadProductiva', 'finalidad')
      .where('engorde.companiaId = :companiaId', { companiaId: ctx.companiaId })
      .andWhere('engorde.granjaId = :granjaId', { granjaId: targetGranjaId });

    if (loteId) {
      qb.andWhere('engorde.loteId = :loteId', { loteId });
    }
    if (estado) {
      qb.andWhere('engorde.estado = :estado', { estado });
    }
    if (incluirAnulados !== 'true') {
      qb.andWhere('engorde.estado <> :anulado', { anulado: EstadoEngorde.ANULADO });
    }

    qb.orderBy('engorde.fechaInicio', 'DESC').addOrderBy('engorde.createdAt', 'DESC');

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await qb.skip(skip).take(query.limit).getManyAndCount();
    const enriched = await Promise.all(
      items.map(async (engorde) => ({
        ...engorde,
        cantidadActual: await this.getCantidadActual(engorde.id, engorde.cantidadInicial),
      })),
    );

    return {
      items: enriched,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async obtenerResumen(ctx: TenantContext, id: string) {
    requirePermission(ctx, PERMISOS.ENGORDE_VER);
    const engorde = await this.findAccessible(ctx, id);
    return this.buildResumen(engorde);
  }

  async iniciar(ctx: TenantContext, input: IniciarEngordeInput) {
    requirePermission(ctx, PERMISOS.ENGORDE_INICIAR);
    const parsed = iniciarEngordeSchema.parse(input);
    await this.assertGranjaAccesible(ctx, parsed.granjaId);

    const lote = await this.loteRepo.findOne({
      where: { id: parsed.loteId },
      relations: { finalidadProductiva: true },
    });
    if (!lote || lote.companiaId !== ctx.companiaId) {
      throw new NotFoundError('El lote solicitado no existe.');
    }
    if (lote.granjaId !== parsed.granjaId) {
      throw new ConflictError(
        'ENGORDE_LOTE_NO_ELEGIBLE',
        'Solo puede iniciar engorde en un lote activo con finalidad Engorde.',
      );
    }
    if (
      lote.estadoRegistro !== EstadoRegistro.ACTIVO ||
      lote.estadoOperativo !== EstadoLote.ACTIVO ||
      lote.finalidadProductiva?.codigoSistema !== 'ENGORDE'
    ) {
      throw new ConflictError(
        'ENGORDE_LOTE_NO_ELEGIBLE',
        'Solo puede iniciar engorde en un lote activo con finalidad Engorde.',
      );
    }
    if (lote.cantidadInicial <= 0) {
      throw new ConflictError(
        'ENGORDE_LOTE_NO_ELEGIBLE',
        'Solo puede iniciar engorde en un lote activo con finalidad Engorde.',
      );
    }

    const existing = await this.engordeRepo.findOne({
      where: {
        loteId: lote.id,
        estado: Not(EstadoEngorde.ANULADO),
      },
    });
    if (existing) {
      throw new ConflictError(
        'ENGORDE_YA_EXISTE',
        'El lote ya tiene un proceso de engorde valido.',
      );
    }

    assertFechaInicioEngorde(parsed.fechaInicio, lote.fechaInicio);
    assertObjetivoPesoValido(parsed.objetivoPesoKg, parsed.pesoInicialPromedioKg);

    const unidadKg = await this.resolveUnidadKg();
    let pesoInput: PesoInput | undefined;
    if (parsed.pesoInicialPromedioKg !== undefined) {
      pesoInput = await this.resolvePesoInput(
        ctx,
        {
          pesoPromedioKg: parsed.pesoInicialPromedioKg,
          modalidad: parsed.modalidadPesoInicial as ModalidadControlPeso,
          metodoPesajeId: parsed.metodoPesajeInicialId!,
          cantidadMuestra: parsed.cantidadMuestraInicial,
        },
        lote.cantidadInicial,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const engorde = await manager.save(
        manager.create(EngordeLote, {
          companiaId: ctx.companiaId,
          granjaId: parsed.granjaId,
          loteId: lote.id,
          fechaInicio: parsed.fechaInicio,
          cantidadInicial: lote.cantidadInicial,
          objetivoPesoKg:
            parsed.objetivoPesoKg !== undefined ? String(parsed.objetivoPesoKg) : undefined,
          observaciones: parsed.observaciones,
          estado: EstadoEngorde.EN_CURSO,
          createdById: ctx.userId,
        }),
      );

      if (pesoInput) {
        await manager.save(
          manager.create(ControlPeso, {
            companiaId: ctx.companiaId,
            granjaId: parsed.granjaId,
            loteId: lote.id,
            engordeId: engorde.id,
            momento: MomentoControlPeso.INICIAL,
            modalidad: pesoInput.modalidad,
            origen: OrigenControlPeso.ENGORDE_INICIO,
            metodoPesajeId: pesoInput.metodoPesajeId,
            fecha: parsed.fechaInicio,
            pesoPromedioKg: String(pesoInput.pesoPromedioKg),
            unidadMedidaId: unidadKg.id,
            cantidadMuestra: pesoInput.cantidadMuestra,
            anulado: false,
            createdById: ctx.userId,
          }),
        );
      }

      const saved = await manager.findOneOrFail(EngordeLote, {
        where: { id: engorde.id },
        relations: { lote: { finalidadProductiva: true }, granja: true },
      });
      return this.buildResumen(saved, manager);
    });
  }

  async registrarBaja(ctx: TenantContext, engordeId: string, input: CrearBajaEngordeInput) {
    requirePermission(ctx, PERMISOS.ENGORDE_BAJAS_CREAR);
    const parsed = crearBajaEngordeSchema.parse(input);
    assertCantidadBajaValida(parsed.cantidad);

    const engorde = await this.findAccessible(ctx, engordeId);
    if (engorde.estado !== EstadoEngorde.EN_CURSO) {
      throw new ConflictError('ENGORDE_NO_EN_CURSO', 'El lote no tiene un engorde activo.');
    }

    const lote = await this.loteRepo.findOne({ where: { id: engorde.loteId } });
    if (
      !lote ||
      lote.estadoRegistro !== EstadoRegistro.ACTIVO ||
      lote.estadoOperativo !== EstadoLote.ACTIVO
    ) {
      throw new ConflictError('ENGORDE_NO_EN_CURSO', 'El lote no tiene un engorde activo.');
    }

    assertFechaBaja(parsed.fecha, engorde.fechaInicio);

    const motivo = await this.motivoBajaRepo.findOne({
      where: { id: parsed.motivoId, companiaId: ctx.companiaId },
    });
    if (!motivo || motivo.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new BusinessRuleError(
        'ENGORDE_MOTIVO_BAJA_INVALIDO',
        'Seleccione un motivo de baja activo.',
      );
    }

    const cantidadActual = await this.getCantidadActual(engorde.id, engorde.cantidadInicial);
    assertBajaNoExcedeCantidad(parsed.cantidad, cantidadActual);

    const baja = await this.bajaRepo.save(
      this.bajaRepo.create({
        companiaId: engorde.companiaId,
        granjaId: engorde.granjaId,
        engordeId: engorde.id,
        loteId: engorde.loteId,
        motivoId: motivo.id,
        fecha: parsed.fecha,
        cantidad: parsed.cantidad,
        observaciones: parsed.observaciones,
        anulado: false,
        createdById: ctx.userId,
      }),
    );

    return {
      baja,
      cantidadActual: cantidadActual - parsed.cantidad,
    };
  }

  async anularBaja(
    ctx: TenantContext,
    engordeId: string,
    bajaId: string,
    input: AnularEngordeInput,
  ) {
    requirePermission(ctx, PERMISOS.ENGORDE_ANULAR);
    const parsed = anularEngordeSchema.parse(input);
    const engorde = await this.findAccessible(ctx, engordeId);

    const baja = await this.bajaRepo.findOne({
      where: { id: bajaId, engordeId: engorde.id, companiaId: ctx.companiaId },
    });
    if (!baja) {
      throw new NotFoundError('La baja solicitada no existe.');
    }
    if (baja.anulado) {
      throw new ConflictError('ENGORDE_BAJA_YA_ANULADA', 'La baja ya fue anulada.');
    }

    const cierreVigente = await this.cierreRepo.findOne({
      where: { engordeId: engorde.id, anulado: false },
    });
    if (cierreVigente) {
      throw new ConflictError(
        'ENGORDE_BAJA_CON_CIERRE',
        'Anule primero el cierre para corregir esta baja.',
      );
    }

    baja.anulado = true;
    baja.anuladoAt = new Date();
    baja.anuladoById = ctx.userId;
    baja.motivoAnulacion = parsed.motivo;
    await this.bajaRepo.save(baja);

    return {
      baja,
      cantidadActual: await this.getCantidadActual(engorde.id, engorde.cantidadInicial),
    };
  }

  async cerrar(ctx: TenantContext, engordeId: string, input: CerrarEngordeInput) {
    requirePermission(ctx, PERMISOS.ENGORDE_CERRAR);
    const parsed = cerrarEngordeSchema.parse(input);
    const engorde = await this.findAccessible(ctx, engordeId);

    if (engorde.estado === EstadoEngorde.ANULADO) {
      throw new ConflictError('ENGORDE_YA_ANULADO', 'El engorde ya fue anulado.');
    }
    if (engorde.estado !== EstadoEngorde.EN_CURSO) {
      throw new ConflictError('ENGORDE_YA_CERRADO', 'El engorde ya fue cerrado.');
    }

    assertFechaCierre(parsed.fechaCierre, engorde.fechaInicio);

    const motivo = await this.motivoCierreRepo.findOne({
      where: { id: parsed.motivoCierreId, companiaId: ctx.companiaId },
    });
    if (!motivo || motivo.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new BusinessRuleError(
        'ENGORDE_MOTIVO_CIERRE_INVALIDO',
        'Seleccione un motivo de cierre activo.',
      );
    }

    const cantidadActual = await this.getCantidadActual(engorde.id, engorde.cantidadInicial);
    assertCantidadFinalValida(parsed.cantidadFinal, cantidadActual);
    assertPesoFinalAplicabilidad(
      parsed.cantidadFinal,
      parsed.pesoFinalPromedioKg !== undefined,
    );

    await this.assertSinEventosPosteriores(engorde, parsed.fechaCierre);

    const unidadKg = await this.resolveUnidadKg();
    let pesoInput: PesoInput | undefined;
    if (parsed.pesoFinalPromedioKg !== undefined) {
      pesoInput = await this.resolvePesoInput(
        ctx,
        {
          pesoPromedioKg: parsed.pesoFinalPromedioKg,
          modalidad: parsed.modalidadPesoFinal as ModalidadControlPeso,
          metodoPesajeId: parsed.metodoPesajeFinalId!,
          cantidadMuestra: parsed.cantidadMuestraFinal,
        },
        cantidadActual,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const cierre = await manager.save(
        manager.create(CierreEngorde, {
          companiaId: engorde.companiaId,
          granjaId: engorde.granjaId,
          engordeId: engorde.id,
          loteId: engorde.loteId,
          fechaCierre: parsed.fechaCierre,
          cantidadFinal: parsed.cantidadFinal,
          motivoCierreId: motivo.id,
          observaciones: parsed.observaciones,
          anulado: false,
          createdById: ctx.userId,
        }),
      );

      if (pesoInput) {
        await manager.save(
          manager.create(ControlPeso, {
            companiaId: engorde.companiaId,
            granjaId: engorde.granjaId,
            loteId: engorde.loteId,
            engordeId: engorde.id,
            momento: MomentoControlPeso.FINAL,
            modalidad: pesoInput.modalidad,
            origen: OrigenControlPeso.ENGORDE_CIERRE,
            metodoPesajeId: pesoInput.metodoPesajeId,
            fecha: parsed.fechaCierre,
            pesoPromedioKg: String(pesoInput.pesoPromedioKg),
            unidadMedidaId: unidadKg.id,
            cantidadMuestra: pesoInput.cantidadMuestra,
            cierreEngordeId: cierre.id,
            anulado: false,
            createdById: ctx.userId,
          }),
        );
      }

      engorde.estado = EstadoEngorde.CERRADO;
      await manager.save(engorde);

      const lote = await manager.findOne(Lote, { where: { id: engorde.loteId } });
      if (lote) {
        lote.estadoOperativo = EstadoLote.CERRADO;
        lote.updatedById = ctx.userId;
        await manager.save(lote);
      }

      const saved = await manager.findOneOrFail(EngordeLote, {
        where: { id: engorde.id },
        relations: { lote: { finalidadProductiva: true }, granja: true },
      });
      return this.buildResumen(saved, manager);
    });
  }

  async anularCierre(
    ctx: TenantContext,
    engordeId: string,
    cierreId: string,
    input: AnularEngordeInput,
  ) {
    requirePermission(ctx, PERMISOS.ENGORDE_ANULAR);
    const parsed = anularEngordeSchema.parse(input);
    const engorde = await this.findAccessible(ctx, engordeId);

    const cierre = await this.cierreRepo.findOne({
      where: { id: cierreId, engordeId: engorde.id, companiaId: ctx.companiaId },
    });
    if (!cierre) {
      throw new NotFoundError('El cierre solicitado no existe.');
    }
    if (cierre.anulado) {
      throw new ConflictError('ENGORDE_CIERRE_YA_ANULADO', 'El cierre ya fue anulado.');
    }

    const vigente = await this.cierreRepo.findOne({
      where: { engordeId: engorde.id, anulado: false },
    });
    if (!vigente || vigente.id !== cierre.id) {
      throw new ConflictError(
        'ENGORDE_CIERRE_NO_VIGENTE',
        'El cierre indicado no es el cierre vigente.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      cierre.anulado = true;
      cierre.anuladoAt = new Date();
      cierre.anuladoById = ctx.userId;
      cierre.motivoAnulacion = parsed.motivo;
      await manager.save(cierre);

      const controlesFinales = await manager.find(ControlPeso, {
        where: {
          engordeId: engorde.id,
          cierreEngordeId: cierre.id,
          origen: OrigenControlPeso.ENGORDE_CIERRE,
          anulado: false,
        },
      });
      for (const control of controlesFinales) {
        control.anulado = true;
        control.anuladoAt = new Date();
        control.anuladoById = ctx.userId;
        control.motivoAnulacion = parsed.motivo;
        await manager.save(control);
      }

      engorde.estado = EstadoEngorde.EN_CURSO;
      await manager.save(engorde);

      const lote = await manager.findOne(Lote, { where: { id: engorde.loteId } });
      if (lote) {
        lote.estadoOperativo = EstadoLote.ACTIVO;
        lote.updatedById = ctx.userId;
        await manager.save(lote);
      }

      const saved = await manager.findOneOrFail(EngordeLote, {
        where: { id: engorde.id },
        relations: { lote: { finalidadProductiva: true }, granja: true },
      });
      return this.buildResumen(saved, manager);
    });
  }

  async anularProceso(ctx: TenantContext, engordeId: string, input: AnularEngordeInput) {
    requirePermission(ctx, PERMISOS.ENGORDE_ANULAR);
    const parsed = anularEngordeSchema.parse(input);
    const engorde = await this.findAccessible(ctx, engordeId);

    if (engorde.estado === EstadoEngorde.ANULADO) {
      throw new ConflictError('ENGORDE_YA_ANULADO', 'El engorde ya fue anulado.');
    }
    if (engorde.estado !== EstadoEngorde.EN_CURSO) {
      throw new ConflictError(
        'ENGORDE_ANULACION_CON_DEPENDENCIAS',
        'El engorde tiene actividad y no puede anularse completo.',
      );
    }

    const [bajasVigentes, consumosPeriodo, controlesManuales] = await Promise.all([
      this.bajaRepo.count({ where: { engordeId: engorde.id, anulado: false } }),
      this.consumoRepo
        .createQueryBuilder('consumo')
        .where('consumo.loteId = :loteId', { loteId: engorde.loteId })
        .andWhere('consumo.anulado = false')
        .andWhere('consumo.fecha >= :fechaInicio', { fechaInicio: engorde.fechaInicio })
        .getCount(),
      this.controlPesoRepo.count({
        where: {
          engordeId: engorde.id,
          anulado: false,
          origen: OrigenControlPeso.MANUAL,
        },
      }),
    ]);

    if (bajasVigentes > 0 || consumosPeriodo > 0 || controlesManuales > 0) {
      throw new ConflictError(
        'ENGORDE_ANULACION_CON_DEPENDENCIAS',
        'El engorde tiene actividad y no puede anularse completo.',
        {
          bajasVigentes,
          consumosPeriodo,
          controlesManuales,
        },
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const controlesInicio = await manager.find(ControlPeso, {
        where: {
          engordeId: engorde.id,
          origen: OrigenControlPeso.ENGORDE_INICIO,
          anulado: false,
        },
      });
      for (const control of controlesInicio) {
        control.anulado = true;
        control.anuladoAt = new Date();
        control.anuladoById = ctx.userId;
        control.motivoAnulacion = parsed.motivo;
        await manager.save(control);
      }

      engorde.estado = EstadoEngorde.ANULADO;
      engorde.anuladoAt = new Date();
      engorde.anuladoById = ctx.userId;
      engorde.motivoAnulacion = parsed.motivo;
      await manager.save(engorde);

      const saved = await manager.findOneOrFail(EngordeLote, {
        where: { id: engorde.id },
        relations: { lote: { finalidadProductiva: true }, granja: true },
      });
      return this.buildResumen(saved, manager);
    });
  }

  private async buildResumen(engorde: EngordeLote, manager?: EntityManager) {
    const bajaRepo = manager ? manager.getRepository(BajaEngorde) : this.bajaRepo;
    const cierreRepo = manager ? manager.getRepository(CierreEngorde) : this.cierreRepo;
    const controlRepo = manager ? manager.getRepository(ControlPeso) : this.controlPesoRepo;
    const consumoRepo = manager ? manager.getRepository(ConsumoAlimento) : this.consumoRepo;

    const [bajas, cierres, controles, consumos] = await Promise.all([
      bajaRepo.find({
        where: { engordeId: engorde.id },
        relations: { motivo: true },
        order: { fecha: 'DESC', createdAt: 'DESC' },
      }),
      cierreRepo.find({
        where: { engordeId: engorde.id },
        relations: { motivoCierre: true },
        order: { fechaCierre: 'DESC', createdAt: 'DESC' },
      }),
      controlRepo.find({
        where: { engordeId: engorde.id },
        relations: { metodoPesaje: true },
        order: { fecha: 'ASC', createdAt: 'ASC' },
      }),
      consumoRepo.find({
        where: { loteId: engorde.loteId, anulado: false },
        relations: { alimento: true, unidadMedida: true },
        order: { fecha: 'ASC' },
      }),
    ]);

    const cierreVigente = cierres.find((c) => !c.anulado) ?? null;
    const fechaHasta = cierreVigente?.fechaCierre ?? new Date().toISOString().slice(0, 10);
    const consumosPeriodo = consumos.filter(
      (c) => c.fecha >= engorde.fechaInicio && c.fecha <= fechaHasta,
    );
    const consumoTotal = consumosPeriodo.reduce((sum, c) => sum + Number(c.cantidad), 0);

    const controlesVigentes = controles.filter((c) => !c.anulado);
    const pesoInicial = controlesVigentes.find(
      (c) => c.momento === MomentoControlPeso.INICIAL,
    );
    const pesoFinal = controlesVigentes.find((c) => c.momento === MomentoControlPeso.FINAL);
    const ultimoPeso = [...controlesVigentes].at(-1) ?? null;

    const cantidadActual = calcularCantidadActual(engorde.cantidadInicial, bajas);
    const pesoInicialNum = pesoInicial ? Number(pesoInicial.pesoPromedioKg) : null;
    const pesoFinalNum = pesoFinal ? Number(pesoFinal.pesoPromedioKg) : null;

    return {
      ...engorde,
      cantidadActual,
      bajas,
      cierres,
      cierreVigente,
      controles,
      pesoInicialPromedioKg: pesoInicialNum,
      pesoFinalPromedioKg: pesoFinalNum,
      ultimoPesoPromedioKg: ultimoPeso ? Number(ultimoPeso.pesoPromedioKg) : null,
      gananciaPromedioKg:
        pesoInicialNum !== null && pesoFinalNum !== null
          ? pesoFinalNum - pesoInicialNum
          : null,
      consumoPeriodo: {
        total: consumoTotal,
        items: consumosPeriodo,
        desde: engorde.fechaInicio,
        hasta: fechaHasta,
      },
    };
  }

  private async getCantidadActual(engordeId: string, cantidadInicial: number) {
    const bajas = await this.bajaRepo.find({
      where: { engordeId },
      select: ['cantidad', 'anulado'],
    });
    return calcularCantidadActual(cantidadInicial, bajas);
  }

  private async assertSinEventosPosteriores(engorde: EngordeLote, fechaCierre: string) {
    const [bajasPosteriores, consumosPosteriores, controlesPosteriores] = await Promise.all([
      this.bajaRepo
        .createQueryBuilder('baja')
        .where('baja.engordeId = :engordeId', { engordeId: engorde.id })
        .andWhere('baja.anulado = false')
        .andWhere('baja.fecha > :fechaCierre', { fechaCierre })
        .getCount(),
      this.consumoRepo
        .createQueryBuilder('consumo')
        .where('consumo.loteId = :loteId', { loteId: engorde.loteId })
        .andWhere('consumo.anulado = false')
        .andWhere('consumo.fecha > :fechaCierre', { fechaCierre })
        .andWhere('consumo.fecha >= :fechaInicio', { fechaInicio: engorde.fechaInicio })
        .getCount(),
      this.controlPesoRepo
        .createQueryBuilder('control')
        .where('control.engordeId = :engordeId', { engordeId: engorde.id })
        .andWhere('control.anulado = false')
        .andWhere('control.fecha > :fechaCierre', { fechaCierre })
        .getCount(),
    ]);

    if (bajasPosteriores > 0 || consumosPosteriores > 0 || controlesPosteriores > 0) {
      throw new ConflictError(
        'ENGORDE_EVENTOS_POSTERIORES',
        'Existen eventos posteriores a la fecha de cierre.',
        {
          bajasPosteriores,
          consumosPosteriores,
          controlesPosteriores,
        },
      );
    }
  }

  private async resolvePesoInput(
    ctx: TenantContext,
    input: PesoInput,
    cantidadDisponible: number,
  ): Promise<PesoInput> {
    if (input.pesoPromedioKg <= 0) {
      throw new BusinessRuleError('PESO_VALOR_INVALIDO', 'El peso debe ser mayor que cero.');
    }
    assertMuestraPeso(input.modalidad, input.cantidadMuestra, cantidadDisponible);

    const metodo = await this.metodoPesajeRepo.findOne({
      where: { id: input.metodoPesajeId, companiaId: ctx.companiaId },
    });
    if (!metodo || metodo.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new BusinessRuleError(
        'PESO_METODO_INVALIDO',
        'Seleccione un metodo de pesaje activo.',
      );
    }

    return {
      ...input,
      cantidadMuestra:
        input.modalidad === ModalidadControlPeso.MUESTRA ? input.cantidadMuestra : undefined,
    };
  }

  private async resolveUnidadKg() {
    const unidad = await this.unidadRepo.findOne({
      where: { codigo: 'KG', estadoRegistro: EstadoRegistro.ACTIVO },
    });
    if (!unidad) {
      throw new BusinessRuleError(
        'PESO_UNIDAD_INVALIDA',
        'Los controles del MVP deben registrarse en kilogramos.',
      );
    }
    return unidad;
  }

  private async findAccessible(ctx: TenantContext, id: string) {
    const engorde = await this.engordeRepo.findOne({
      where: { id, companiaId: ctx.companiaId },
      relations: { lote: { finalidadProductiva: true }, granja: true },
    });
    if (!engorde) {
      throw new NotFoundError('El engorde solicitado no existe.');
    }
    await this.assertGranjaAccesible(ctx, engorde.granjaId);
    return engorde;
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
