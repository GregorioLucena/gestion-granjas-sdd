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
  AnularControlPesoInput,
  CrearControlPesoInput,
} from '@gestion-granjas/shared/schemas/pesos.schemas';
import {
  anularControlPesoSchema,
  crearControlPesoSchema,
} from '@gestion-granjas/shared/schemas/pesos.schemas';
import type {
  ListQuery,
  PaginatedResponse,
} from '@gestion-granjas/shared/schemas/pagination.schemas';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BajaEngorde,
  ControlPeso,
  EngordeLote,
  Granja,
  Lote,
  MetodoPesaje,
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
import { Repository } from 'typeorm';
import {
  assertAnulacionManualPermitida,
  assertCantidadDisponibleParaPeso,
  assertFechaControl,
  assertMuestraPeso,
  assertPesoValido,
  calcularDiferenciaKg,
} from './pesos.rules';

export type ControlPesoConDiferencia = ControlPeso & {
  diferenciaKg: number | null;
};

@Injectable()
export class PesosService {
  constructor(
    @InjectRepository(ControlPeso)
    private readonly controlRepo: Repository<ControlPeso>,
    @InjectRepository(EngordeLote)
    private readonly engordeRepo: Repository<EngordeLote>,
    @InjectRepository(BajaEngorde)
    private readonly bajaRepo: Repository<BajaEngorde>,
    @InjectRepository(Lote) private readonly loteRepo: Repository<Lote>,
    @InjectRepository(Granja) private readonly granjaRepo: Repository<Granja>,
    @InjectRepository(MetodoPesaje)
    private readonly metodoRepo: Repository<MetodoPesaje>,
    @InjectRepository(UnidadMedida)
    private readonly unidadRepo: Repository<UnidadMedida>,
  ) {}

  async listar(
    ctx: TenantContext,
    query: ListQuery,
    granjaId?: string,
    engordeId?: string,
    loteId?: string,
    fechaDesde?: string,
    fechaHasta?: string,
    incluirAnulados?: string,
  ): Promise<PaginatedResponse<ControlPesoConDiferencia>> {
    requirePermission(ctx, PERMISOS.PESOS_VER);

    const targetGranjaId = granjaId ?? ctx.granjaActivaId;
    if (!targetGranjaId) {
      return {
        items: [],
        meta: { page: query.page, limit: query.limit, total: 0, totalPages: 1 },
      };
    }

    await this.assertGranjaAccesible(ctx, targetGranjaId);

    const qb = this.controlRepo
      .createQueryBuilder('control')
      .leftJoinAndSelect('control.lote', 'lote')
      .leftJoinAndSelect('control.engorde', 'engorde')
      .leftJoinAndSelect('control.metodoPesaje', 'metodoPesaje')
      .leftJoinAndSelect('control.unidadMedida', 'unidadMedida')
      .where('control.companiaId = :companiaId', { companiaId: ctx.companiaId })
      .andWhere('control.granjaId = :granjaId', { granjaId: targetGranjaId });

    if (engordeId) {
      qb.andWhere('control.engordeId = :engordeId', { engordeId });
    }
    if (loteId) {
      qb.andWhere('control.loteId = :loteId', { loteId });
    }
    if (fechaDesde) {
      qb.andWhere('control.fecha >= :fechaDesde', { fechaDesde });
    }
    if (fechaHasta) {
      qb.andWhere('control.fecha <= :fechaHasta', { fechaHasta });
    }
    if (incluirAnulados !== 'true') {
      qb.andWhere('control.anulado = false');
    }

    qb.orderBy('control.fecha', 'ASC').addOrderBy('control.createdAt', 'ASC');

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await qb.skip(skip).take(query.limit).getManyAndCount();

    const anteriores = await this.loadAnterioresParaDiferencia(items);
    const enriched = items.map((control) => {
      const prev = anteriores.get(control.id) ?? null;
      return {
        ...control,
        diferenciaKg: calcularDiferenciaKg(Number(control.pesoPromedioKg), prev),
      };
    });

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

  async obtener(ctx: TenantContext, id: string): Promise<ControlPesoConDiferencia> {
    requirePermission(ctx, PERMISOS.PESOS_VER);
    const control = await this.findAccessible(ctx, id);
    const anterior = await this.findAnteriorVigente(control);
    return {
      ...control,
      diferenciaKg: calcularDiferenciaKg(
        Number(control.pesoPromedioKg),
        anterior ? Number(anterior.pesoPromedioKg) : null,
      ),
    };
  }

  async crear(ctx: TenantContext, input: CrearControlPesoInput) {
    requirePermission(ctx, PERMISOS.PESOS_CREAR);
    const parsed = crearControlPesoSchema.parse(input);
    assertPesoValido(parsed.pesoPromedioKg);

    const engorde = await this.engordeRepo.findOne({
      where: { id: parsed.engordeId, companiaId: ctx.companiaId },
    });
    if (!engorde) {
      throw new NotFoundError('El engorde solicitado no existe.');
    }

    await this.assertGranjaAccesible(ctx, engorde.granjaId);

    if (engorde.estado !== EstadoEngorde.EN_CURSO) {
      throw new ConflictError(
        'PESO_ENGORDE_NO_EN_CURSO',
        'Solo puede registrar controles en un engorde activo.',
      );
    }

    const lote = await this.loteRepo.findOne({ where: { id: engorde.loteId } });
    if (!lote || lote.companiaId !== ctx.companiaId) {
      throw new NotFoundError('El lote solicitado no existe.');
    }
    if (lote.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('PESO_LOTE_CERRADO', 'No puede registrar peso en un lote cerrado.');
    }
    if (lote.estadoOperativo !== EstadoLote.ACTIVO) {
      throw new ConflictError('PESO_LOTE_CERRADO', 'No puede registrar peso en un lote cerrado.');
    }

    assertFechaControl(parsed.fecha, engorde.fechaInicio);

    const metodo = await this.metodoRepo.findOne({
      where: { id: parsed.metodoPesajeId, companiaId: ctx.companiaId },
    });
    if (!metodo || metodo.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new BusinessRuleError(
        'PESO_METODO_INVALIDO',
        'Seleccione un metodo de pesaje activo.',
      );
    }

    const cantidadEnFecha = await this.calcularCantidadEnFecha(
      engorde.id,
      engorde.cantidadInicial,
      parsed.fecha,
    );
    assertCantidadDisponibleParaPeso(cantidadEnFecha);
    assertMuestraPeso(
      parsed.modalidad as ModalidadControlPeso,
      parsed.cantidadMuestra,
      cantidadEnFecha,
    );

    const unidadKg = await this.resolveUnidadKg();

    const control = await this.controlRepo.save(
      this.controlRepo.create({
        companiaId: ctx.companiaId,
        granjaId: engorde.granjaId,
        loteId: engorde.loteId,
        engordeId: engorde.id,
        momento: MomentoControlPeso.INTERMEDIO,
        modalidad: parsed.modalidad as ModalidadControlPeso,
        origen: OrigenControlPeso.MANUAL,
        metodoPesajeId: metodo.id,
        fecha: parsed.fecha,
        pesoPromedioKg: String(parsed.pesoPromedioKg),
        unidadMedidaId: unidadKg.id,
        cantidadMuestra:
          parsed.modalidad === ModalidadControlPeso.MUESTRA
            ? parsed.cantidadMuestra
            : undefined,
        observaciones: parsed.observaciones,
        anulado: false,
        createdById: ctx.userId,
      }),
    );

    return this.obtener(ctx, control.id);
  }

  async anular(ctx: TenantContext, id: string, input: AnularControlPesoInput) {
    requirePermission(ctx, PERMISOS.PESOS_ANULAR);
    const parsed = anularControlPesoSchema.parse(input);
    const control = await this.findAccessible(ctx, id);
    assertAnulacionManualPermitida(control);

    control.anulado = true;
    control.anuladoAt = new Date();
    control.anuladoById = ctx.userId;
    control.motivoAnulacion = parsed.motivo;
    await this.controlRepo.save(control);

    return this.obtener(ctx, control.id);
  }

  private async calcularCantidadEnFecha(
    engordeId: string,
    cantidadInicial: number,
    fecha: string,
  ): Promise<number> {
    const result = await this.bajaRepo
      .createQueryBuilder('baja')
      .select('COALESCE(SUM(baja.cantidad), 0)', 'total')
      .where('baja.engordeId = :engordeId', { engordeId })
      .andWhere('baja.anulado = false')
      .andWhere('baja.fecha <= :fecha', { fecha })
      .getRawOne<{ total: string }>();

    return cantidadInicial - Number(result?.total ?? 0);
  }

  /**
   * Para cada control de la pagina, obtiene el peso del vigente anterior
   * (por fecha/createdAt) dentro del mismo engorde.
   */
  private async loadAnterioresParaDiferencia(
    items: ControlPeso[],
  ): Promise<Map<string, number | null>> {
    const result = new Map<string, number | null>();
    if (items.length === 0) return result;

    const engordeIds = [...new Set(items.map((item) => item.engordeId))];
    const vigentes = await this.controlRepo
      .createQueryBuilder('control')
      .where('control.engordeId IN (:...engordeIds)', { engordeIds })
      .andWhere('control.anulado = false')
      .orderBy('control.fecha', 'ASC')
      .addOrderBy('control.createdAt', 'ASC')
      .getMany();

    const byEngorde = new Map<string, ControlPeso[]>();
    for (const control of vigentes) {
      const list = byEngorde.get(control.engordeId) ?? [];
      list.push(control);
      byEngorde.set(control.engordeId, list);
    }

    for (const item of items) {
      if (item.anulado) {
        result.set(item.id, null);
        continue;
      }
      const secuencia = byEngorde.get(item.engordeId) ?? [];
      const index = secuencia.findIndex((c) => c.id === item.id);
      if (index <= 0) {
        result.set(item.id, null);
        continue;
      }
      result.set(item.id, Number(secuencia[index - 1].pesoPromedioKg));
    }

    return result;
  }

  private async findAnteriorVigente(control: ControlPeso) {
    if (control.anulado) return null;
    return this.controlRepo
      .createQueryBuilder('control')
      .where('control.engordeId = :engordeId', { engordeId: control.engordeId })
      .andWhere('control.anulado = false')
      .andWhere(
        `(control.fecha < :fecha OR (control.fecha = :fecha AND control.createdAt < :createdAt))`,
        { fecha: control.fecha, createdAt: control.createdAt },
      )
      .orderBy('control.fecha', 'DESC')
      .addOrderBy('control.createdAt', 'DESC')
      .getOne();
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
    const control = await this.controlRepo.findOne({
      where: { id, companiaId: ctx.companiaId },
      relations: {
        lote: true,
        engorde: true,
        metodoPesaje: true,
        unidadMedida: true,
      },
    });
    if (!control) {
      throw new NotFoundError('El control de peso solicitado no existe.');
    }
    await this.assertGranjaAccesible(ctx, control.granjaId);
    return control;
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
