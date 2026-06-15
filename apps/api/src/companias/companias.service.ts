import { ConflictError, NotFoundError } from '@gestion-granjas/shared/errors';
import { PERMISOS, requirePermission } from '@gestion-granjas/shared/permissions';
import type { TenantContext } from '@gestion-granjas/shared';
import type { ListQuery } from '@gestion-granjas/shared/schemas/pagination.schemas';
import {
  actualizarCompaniaSchema,
  crearCompaniaSchema,
  type ActualizarCompaniaInput,
  type CrearCompaniaInput,
} from '@gestion-granjas/shared/schemas/configuracion.schemas';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Compania, Granja } from '@gestion-granjas/database/entities';
import { EstadoRegistro } from '@gestion-granjas/database/enums';
import { paginate } from '../common/pagination/paginate';
import { assertCompaniaCanInactivate } from './companias.rules';

@Injectable()
export class CompaniasService {
  constructor(
    @InjectRepository(Compania) private readonly companiaRepo: Repository<Compania>,
    @InjectRepository(Granja) private readonly granjaRepo: Repository<Granja>,
  ) {}

  async listar(ctx: TenantContext, query: ListQuery) {
    requirePermission(ctx, PERMISOS.COMPANIAS_VER);

    const qb = this.companiaRepo.createQueryBuilder('compania');

    if (!this.canManageAll(ctx)) {
      qb.where('compania.id = :companiaId', { companiaId: ctx.companiaId });
    }

    return paginate(qb, query, 'compania');
  }

  async crear(ctx: TenantContext, input: CrearCompaniaInput) {
    requirePermission(ctx, PERMISOS.COMPANIAS_CREAR);
    const parsed = crearCompaniaSchema.parse(input);

    const exists = await this.companiaRepo.findOne({ where: { nombre: parsed.nombre } });
    if (exists) {
      throw new ConflictError('COMPANIA_NOMBRE_DUPLICADO', 'Ya existe una compania con ese nombre.');
    }

    const compania = this.companiaRepo.create({
      ...parsed,
      ...this.normalizeOptionalContactFields(parsed),
      estadoRegistro: EstadoRegistro.ACTIVO,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    });

    return this.companiaRepo.save(compania);
  }

  async actualizar(ctx: TenantContext, id: string, input: ActualizarCompaniaInput) {
    requirePermission(ctx, PERMISOS.COMPANIAS_EDITAR);
    const parsed = actualizarCompaniaSchema.parse(input);
    const compania = await this.findAccessible(ctx, id);

    if (
      parsed.estadoRegistro === EstadoRegistro.INACTIVO &&
      compania.estadoRegistro === EstadoRegistro.ACTIVO
    ) {
      await assertCompaniaCanInactivate(compania.id, this.granjaRepo);
    }

    if (parsed.nombre && parsed.nombre !== compania.nombre) {
      const exists = await this.companiaRepo.findOne({ where: { nombre: parsed.nombre } });
      if (exists) {
        throw new ConflictError('COMPANIA_NOMBRE_DUPLICADO', 'Ya existe una compania con ese nombre.');
      }
    }

    Object.assign(compania, {
      ...parsed,
      ...this.normalizeOptionalContactFields(parsed),
      updatedById: ctx.userId,
    });

    return this.companiaRepo.save(compania);
  }

  private async findAccessible(ctx: TenantContext, id: string) {
    const compania = await this.companiaRepo.findOne({ where: { id } });
    if (!compania) {
      throw new NotFoundError('La compania solicitada no existe.');
    }

    if (!this.canManageAll(ctx) && compania.id !== ctx.companiaId) {
      throw new NotFoundError('La compania solicitada no existe.');
    }

    return compania;
  }

  private canManageAll(ctx: TenantContext) {
    return ctx.permisos.includes(PERMISOS.COMPANIAS_CREAR);
  }

  private normalizeOptionalContactFields(input: {
    identificacionFiscal?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
  }) {
    const result: {
      identificacionFiscal?: string;
      telefono?: string;
      correo?: string;
      direccion?: string;
    } = {};

    if ('identificacionFiscal' in input) {
      result.identificacionFiscal = input.identificacionFiscal?.trim() || undefined;
    }
    if ('telefono' in input) {
      result.telefono = input.telefono?.trim() || undefined;
    }
    if ('correo' in input) {
      result.correo = input.correo?.trim() || undefined;
    }
    if ('direccion' in input) {
      result.direccion = input.direccion?.trim() || undefined;
    }

    return result;
  }
}
