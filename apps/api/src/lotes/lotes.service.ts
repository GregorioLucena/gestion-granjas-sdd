import { ConflictError, NotFoundError, BusinessRuleError } from '@gestion-granjas/shared/errors';
import {
  PERMISOS,
  requireGranjaAccess,
  requirePermission,
} from '@gestion-granjas/shared/permissions';
import type { TenantContext } from '@gestion-granjas/shared';
import type {
  CrearLoteInput,
  ActualizarLoteInput,
  EstadoLoteInput,
} from '@gestion-granjas/shared/schemas/lotes.schemas';
import {
  crearLoteSchema,
  actualizarLoteSchema,
  estadoLoteSchema,
} from '@gestion-granjas/shared/schemas/lotes.schemas';
import type {
  ListQuery,
  PaginatedResponse,
} from '@gestion-granjas/shared/schemas/pagination.schemas';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EngordeLote,
  FinalidadProductiva,
  Granja,
  Lote,
  TipoAnimal,
  Ubicacion,
} from '@gestion-granjas/database/entities';
import { EstadoEngorde, EstadoLote, EstadoRegistro } from '@gestion-granjas/database/enums';
import { Not, Repository } from 'typeorm';
import { assertCantidadInicialValida } from './lotes.rules';

@Injectable()
export class LotesService {
  constructor(
    @InjectRepository(Lote) private readonly loteRepo: Repository<Lote>,
    @InjectRepository(Granja) private readonly granjaRepo: Repository<Granja>,
    @InjectRepository(TipoAnimal) private readonly tipoAnimalRepo: Repository<TipoAnimal>,
    @InjectRepository(FinalidadProductiva)
    private readonly finalidadRepo: Repository<FinalidadProductiva>,
    @InjectRepository(Ubicacion) private readonly ubicacionRepo: Repository<Ubicacion>,
    @InjectRepository(EngordeLote) private readonly engordeRepo: Repository<EngordeLote>,
  ) {}

  async listar(
    ctx: TenantContext,
    query: ListQuery,
    granjaId?: string,
    estadoOperativo?: string,
  ): Promise<PaginatedResponse<Lote>> {
    requirePermission(ctx, PERMISOS.LOTES_VER);

    const targetGranjaId = granjaId ?? ctx.granjaActivaId;
    if (!targetGranjaId) {
      return {
        items: [],
        meta: { page: query.page, limit: query.limit, total: 0, totalPages: 1 },
      };
    }

    await this.assertGranjaAccesible(ctx, targetGranjaId);
    const estadoOperativoParsed = this.parseEstadoOperativoFiltro(estadoOperativo);

    const qb = this.loteRepo
      .createQueryBuilder('lote')
      .leftJoinAndSelect('lote.granja', 'granja')
      .leftJoinAndSelect('lote.tipoAnimal', 'tipoAnimal')
      .leftJoinAndSelect('lote.finalidadProductiva', 'finalidadProductiva')
      .leftJoinAndSelect('lote.ubicacion', 'ubicacion')
      .where('lote.companiaId = :companiaId', { companiaId: ctx.companiaId })
      .andWhere('lote.granjaId = :granjaId', { granjaId: targetGranjaId });

    if (query.search) {
      qb.andWhere('lote.codigo ILIKE :search', { search: `%${query.search}%` });
    }

    if (query.estadoRegistro !== 'TODOS') {
      qb.andWhere('lote.estadoRegistro = :estadoRegistro', {
        estadoRegistro: query.estadoRegistro,
      });
    }

    if (estadoOperativoParsed) {
      qb.andWhere('lote.estadoOperativo = :estadoOperativo', {
        estadoOperativo: estadoOperativoParsed,
      });
    }

    qb.orderBy('lote.codigo', 'ASC');
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

  async crear(ctx: TenantContext, input: CrearLoteInput) {
    requirePermission(ctx, PERMISOS.LOTES_CREAR);
    const parsed = crearLoteSchema.parse(input);
    assertCantidadInicialValida(parsed.cantidadInicial);

    await this.assertGranjaActiva(ctx, parsed.granjaId);
    await this.assertReferenciasActivas(ctx, parsed);
    await this.assertCodigoDisponible(parsed.granjaId, parsed.codigo);

    const lote = this.loteRepo.create({
      ...parsed,
      estadoOperativo: parsed.estadoOperativo as EstadoLote,
      companiaId: ctx.companiaId,
      estadoRegistro: EstadoRegistro.ACTIVO,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    });

    return this.loteRepo.save(lote);
  }

  async actualizar(ctx: TenantContext, id: string, input: ActualizarLoteInput) {
    requirePermission(ctx, PERMISOS.LOTES_EDITAR);
    const parsed = actualizarLoteSchema.parse(input);
    if (parsed.cantidadInicial !== undefined) {
      assertCantidadInicialValida(parsed.cantidadInicial);
    }

    const lote = await this.findAccessible(ctx, id);

    if (parsed.codigo && parsed.codigo !== lote.codigo) {
      await this.assertCodigoDisponible(lote.granjaId, parsed.codigo, lote.id);
    }

    const engordeVigente = await this.engordeRepo.findOne({
      where: { loteId: lote.id, estado: Not(EstadoEngorde.ANULADO) },
    });

    if (engordeVigente) {
      const cambiaCantidad =
        parsed.cantidadInicial !== undefined &&
        parsed.cantidadInicial !== lote.cantidadInicial;
      const cambiaFecha =
        parsed.fechaInicio !== undefined && parsed.fechaInicio !== lote.fechaInicio;
      if (cambiaCantidad || cambiaFecha) {
        throw new ConflictError(
          'LOTE_ENGORDE_ACTIVO',
          'No puede cambiar cantidad o fecha porque el lote tiene un engorde.',
        );
      }

      if (
        parsed.estadoOperativo !== undefined &&
        parsed.estadoOperativo !== lote.estadoOperativo
      ) {
        throw new ConflictError(
          'LOTE_ESTADO_GESTIONADO_POR_ENGORDE',
          'Cierre o reabra el lote desde el proceso de engorde.',
        );
      }
    }

    await this.assertReferenciasActivas(ctx, {
      granjaId: lote.granjaId,
      tipoAnimalId: parsed.tipoAnimalId ?? lote.tipoAnimalId,
      finalidadProductivaId: parsed.finalidadProductivaId ?? lote.finalidadProductivaId,
      ubicacionId: parsed.ubicacionId,
    });

    Object.assign(lote, {
      ...parsed,
      ...(parsed.estadoOperativo ? { estadoOperativo: parsed.estadoOperativo as EstadoLote } : {}),
      updatedById: ctx.userId,
    });
    return this.loteRepo.save(lote);
  }

  private parseEstadoOperativoFiltro(value?: string): EstadoLoteInput | undefined {
    if (!value || value === 'TODOS') return undefined;
    return estadoLoteSchema.parse(value);
  }

  private async assertGranjaAccesible(ctx: TenantContext, granjaId: string) {
    requireGranjaAccess(ctx, granjaId);
    const granja = await this.granjaRepo.findOne({ where: { id: granjaId } });
    if (!granja || granja.companiaId !== ctx.companiaId) {
      throw new NotFoundError('La granja solicitada no existe.');
    }
    return granja;
  }

  private async assertGranjaActiva(ctx: TenantContext, granjaId: string) {
    const granja = await this.assertGranjaAccesible(ctx, granjaId);
    if (granja.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('GRANJA_INACTIVA', 'La granja esta inactiva.');
    }
  }

  private async assertReferenciasActivas(
    ctx: TenantContext,
    input: {
      granjaId: string;
      tipoAnimalId: string;
      finalidadProductivaId: string;
      ubicacionId?: string;
    },
  ) {
    const tipoAnimal = await this.tipoAnimalRepo.findOne({
      where: { id: input.tipoAnimalId, companiaId: ctx.companiaId },
    });
    if (!tipoAnimal) {
      throw new NotFoundError('El tipo de animal indicado no existe.');
    }
    if (tipoAnimal.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('MAESTRA_INACTIVA', 'El tipo de animal esta inactivo.');
    }

    const finalidad = await this.finalidadRepo.findOne({
      where: { id: input.finalidadProductivaId, companiaId: ctx.companiaId },
    });
    if (!finalidad) {
      throw new NotFoundError('La finalidad productiva indicada no existe.');
    }
    if (finalidad.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('MAESTRA_INACTIVA', 'La finalidad productiva esta inactiva.');
    }

    if (!input.ubicacionId) return;

    const ubicacion = await this.ubicacionRepo.findOne({
      where: { id: input.ubicacionId, granjaId: input.granjaId },
    });
    if (!ubicacion) {
      throw new BusinessRuleError(
        'LOTE_UBICACION_INVALIDA',
        'La ubicacion no pertenece a la granja indicada.',
      );
    }
    if (ubicacion.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('UBICACION_INACTIVA', 'La ubicacion esta inactiva.');
    }
  }

  private async assertCodigoDisponible(granjaId: string, codigo: string, excludeId?: string) {
    const exists = await this.loteRepo.findOne({ where: { granjaId, codigo } });
    if (exists && exists.id !== excludeId) {
      throw new ConflictError(
        'LOTE_CODIGO_DUPLICADO',
        'Ya existe un lote con ese codigo en la granja.',
      );
    }
  }

  private async findAccessible(ctx: TenantContext, id: string) {
    const lote = await this.loteRepo.findOne({
      where: { id },
      relations: {
        granja: true,
        tipoAnimal: true,
        finalidadProductiva: true,
        ubicacion: true,
      },
    });

    if (!lote || lote.companiaId !== ctx.companiaId) {
      throw new NotFoundError('El lote solicitado no existe.');
    }

    requireGranjaAccess(ctx, lote.granjaId);
    return lote;
  }
}
