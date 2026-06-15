import {
  ConflictError,
  BusinessRuleError,
  NotFoundError,
} from '@gestion-granjas/shared/errors';
import { PERMISOS, requireGranjaAccess, requirePermission } from '@gestion-granjas/shared/permissions';
import type { TenantContext } from '@gestion-granjas/shared';
import type { ListQuery } from '@gestion-granjas/shared/schemas/pagination.schemas';
import {
  actualizarGranjaSchema,
  crearGranjaSchema,
  type ActualizarGranjaInput,
  type CrearGranjaInput,
} from '@gestion-granjas/shared/schemas/configuracion.schemas';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Compania, Granja, Lote, Ubicacion } from '@gestion-granjas/database/entities';
import { EstadoRegistro } from '@gestion-granjas/database/enums';
import { paginate } from '../common/pagination/paginate';
import { assertGranjaCanInactivate } from './granjas.rules';

@Injectable()
export class GranjasService {
  constructor(
    @InjectRepository(Granja) private readonly granjaRepo: Repository<Granja>,
    @InjectRepository(Compania) private readonly companiaRepo: Repository<Compania>,
    @InjectRepository(Ubicacion) private readonly ubicacionRepo: Repository<Ubicacion>,
    @InjectRepository(Lote) private readonly loteRepo: Repository<Lote>,
  ) {}

  async listar(ctx: TenantContext, query: ListQuery, companiaId?: string) {
    requirePermission(ctx, PERMISOS.GRANJAS_VER);

    const targetCompaniaId = companiaId ?? ctx.companiaId;
    if (targetCompaniaId !== ctx.companiaId && !ctx.permisos.includes(PERMISOS.COMPANIAS_CREAR)) {
      throw new BusinessRuleError(
        'GRANJA_NO_PERTENECE_COMPANIA',
        'La granja no pertenece a la compania indicada.',
      );
    }

    const qb = this.granjaRepo
      .createQueryBuilder('granja')
      .where('granja.companiaId = :companiaId', { companiaId: targetCompaniaId });

    return paginate(qb, query, 'granja');
  }

  async crear(ctx: TenantContext, input: CrearGranjaInput) {
    requirePermission(ctx, PERMISOS.GRANJAS_CREAR);
    const parsed = crearGranjaSchema.parse(input);

    if (parsed.companiaId !== ctx.companiaId && !ctx.permisos.includes(PERMISOS.COMPANIAS_CREAR)) {
      throw new BusinessRuleError(
        'GRANJA_NO_PERTENECE_COMPANIA',
        'La granja no pertenece a la compania indicada.',
      );
    }

    const compania = await this.companiaRepo.findOne({ where: { id: parsed.companiaId } });
    if (!compania) {
      throw new NotFoundError('La compania indicada no existe.');
    }
    if (compania.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('COMPANIA_INACTIVA', 'La compania esta inactiva.');
    }

    const exists = await this.granjaRepo.findOne({
      where: { companiaId: parsed.companiaId, nombre: parsed.nombre },
    });
    if (exists) {
      throw new ConflictError('GRANJA_NOMBRE_DUPLICADO', 'Ya existe una granja con ese nombre en la compania.');
    }

    const granja = this.granjaRepo.create({
      ...parsed,
      ...this.normalizeOptionalFields(parsed),
      estadoRegistro: EstadoRegistro.ACTIVO,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    });

    return this.granjaRepo.save(granja);
  }

  async actualizar(ctx: TenantContext, id: string, input: ActualizarGranjaInput) {
    requirePermission(ctx, PERMISOS.GRANJAS_EDITAR);
    const parsed = actualizarGranjaSchema.parse(input);
    const granja = await this.findAccessible(ctx, id);

    if (
      parsed.estadoRegistro === EstadoRegistro.INACTIVO &&
      granja.estadoRegistro === EstadoRegistro.ACTIVO
    ) {
      await assertGranjaCanInactivate(granja.id, this.ubicacionRepo, this.loteRepo);
    }

    if (parsed.nombre && parsed.nombre !== granja.nombre) {
      const exists = await this.granjaRepo.findOne({
        where: { companiaId: granja.companiaId, nombre: parsed.nombre },
      });
      if (exists) {
        throw new ConflictError('GRANJA_NOMBRE_DUPLICADO', 'Ya existe una granja con ese nombre en la compania.');
      }
    }

    Object.assign(granja, {
      ...parsed,
      ...this.normalizeOptionalFields(parsed),
      updatedById: ctx.userId,
    });
    return this.granjaRepo.save(granja);
  }

  private normalizeOptionalFields(input: Partial<{ codigo?: string; direccion?: string }>) {
    const result: Partial<{ codigo?: string; direccion?: string }> = {};

    if ('codigo' in input) {
      result.codigo = input.codigo?.trim() || undefined;
    }
    if ('direccion' in input) {
      result.direccion = input.direccion?.trim() || undefined;
    }

    return result;
  }

  private async findAccessible(ctx: TenantContext, id: string) {
    const granja = await this.granjaRepo.findOne({ where: { id } });
    if (!granja) {
      throw new NotFoundError('La granja solicitada no existe.');
    }

    if (granja.companiaId !== ctx.companiaId) {
      throw new NotFoundError('La granja solicitada no existe.');
    }

    requireGranjaAccess(ctx, granja.id);
    return granja;
  }
}
