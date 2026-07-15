import {
  ConflictError,
  BusinessRuleError,
  NotFoundError,
} from '@gestion-granjas/shared/errors';
import { PERMISOS, requireGranjaAccess, requirePermission } from '@gestion-granjas/shared/permissions';
import type { TenantContext } from '@gestion-granjas/shared';
import type { ListQuery, PaginatedResponse } from '@gestion-granjas/shared/schemas/pagination.schemas';
import {
  actualizarMaestraCompaniaSchema,
  actualizarRazaSchema,
  actualizarTipoAnimalSchema,
  actualizarUbicacionSchema,
  crearRazaSchema,
  crearTipoAnimalSchema,
  crearUbicacionSchema,
  maestraCompaniaBaseSchema,
  type ActualizarMaestraCompaniaInput,
  type ActualizarRazaInput,
  type ActualizarTipoAnimalInput,
  type ActualizarUbicacionInput,
  type CrearRazaInput,
  type CrearTipoAnimalInput,
  type CrearUbicacionInput,
} from '@gestion-granjas/shared/schemas/configuracion.schemas';
import {
  actualizarMotivoBajaEngordeSchema,
  crearMotivoBajaEngordeSchema,
  type ActualizarMotivoBajaEngordeInput,
  type CrearMotivoBajaEngordeInput,
} from '@gestion-granjas/shared/schemas/engorde.schemas';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FinalidadProductiva,
  Granja,
  Lote,
  MetodoPesaje,
  MotivoBajaEngorde,
  MotivoCierreEngorde,
  MotivoMovimientoUbicacion,
  Raza,
  TipoAnimal,
  TipoUbicacion,
  Ubicacion,
} from '@gestion-granjas/database/entities';
import { EstadoRegistro } from '@gestion-granjas/database/enums';
import { paginate } from '../common/pagination/paginate';
import {
  assertFinalidadCanInactivate,
  assertTipoAnimalCanInactivate,
  assertTipoUbicacionCanInactivate,
  assertUbicacionCanInactivate,
} from './maestras.rules';

@Injectable()
export class MaestrasService {
  constructor(
    @InjectRepository(TipoAnimal) private readonly tipoAnimalRepo: Repository<TipoAnimal>,
    @InjectRepository(Raza) private readonly razaRepo: Repository<Raza>,
    @InjectRepository(FinalidadProductiva)
    private readonly finalidadRepo: Repository<FinalidadProductiva>,
    @InjectRepository(TipoUbicacion) private readonly tipoUbicacionRepo: Repository<TipoUbicacion>,
    @InjectRepository(Ubicacion) private readonly ubicacionRepo: Repository<Ubicacion>,
    @InjectRepository(MotivoCierreEngorde)
    private readonly motivoCierreRepo: Repository<MotivoCierreEngorde>,
    @InjectRepository(MotivoBajaEngorde)
    private readonly motivoBajaRepo: Repository<MotivoBajaEngorde>,
    @InjectRepository(MotivoMovimientoUbicacion)
    private readonly motivoMovUbicacionRepo: Repository<MotivoMovimientoUbicacion>,
    @InjectRepository(MetodoPesaje)
    private readonly metodoPesajeRepo: Repository<MetodoPesaje>,
    @InjectRepository(Granja) private readonly granjaRepo: Repository<Granja>,
    @InjectRepository(Lote) private readonly loteRepo: Repository<Lote>,
  ) {}

  listarTiposAnimal(ctx: TenantContext, query: ListQuery) {
    this.assertMaestras(ctx);
    const qb = this.tipoAnimalRepo
      .createQueryBuilder('tipoAnimal')
      .where('tipoAnimal.companiaId = :companiaId', { companiaId: ctx.companiaId });
    return paginate(qb, query, 'tipoAnimal');
  }

  async crearTipoAnimal(ctx: TenantContext, input: CrearTipoAnimalInput) {
    this.assertMaestras(ctx);
    const parsed = crearTipoAnimalSchema.parse(input);
    await this.assertNombreUnico(this.tipoAnimalRepo, ctx.companiaId, parsed.nombre);

    const entity = this.tipoAnimalRepo.create({
      ...parsed,
      companiaId: ctx.companiaId,
      estadoRegistro: EstadoRegistro.ACTIVO,
    });
    return this.tipoAnimalRepo.save(entity);
  }

  async actualizarTipoAnimal(ctx: TenantContext, id: string, input: ActualizarTipoAnimalInput) {
    this.assertMaestras(ctx);
    const parsed = actualizarTipoAnimalSchema.parse(input);
    const entity = await this.findCompaniaEntity(this.tipoAnimalRepo, ctx, id);

    if (
      parsed.estadoRegistro === EstadoRegistro.INACTIVO &&
      entity.estadoRegistro === EstadoRegistro.ACTIVO
    ) {
      await assertTipoAnimalCanInactivate(entity.id, this.razaRepo, this.loteRepo);
    }

    if (parsed.nombre && parsed.nombre !== entity.nombre) {
      await this.assertNombreUnico(this.tipoAnimalRepo, ctx.companiaId, parsed.nombre);
    }

    Object.assign(entity, parsed);
    return this.tipoAnimalRepo.save(entity);
  }

  listarRazas(ctx: TenantContext, query: ListQuery, tipoAnimalId?: string) {
    this.assertMaestras(ctx);
    const qb = this.razaRepo
      .createQueryBuilder('raza')
      .where('raza.companiaId = :companiaId', { companiaId: ctx.companiaId });

    if (tipoAnimalId) {
      qb.andWhere('raza.tipoAnimalId = :tipoAnimalId', { tipoAnimalId });
    }

    return paginate(qb, query, 'raza');
  }

  async crearRaza(ctx: TenantContext, input: CrearRazaInput) {
    this.assertMaestras(ctx);
    const parsed = crearRazaSchema.parse(input);
    const tipoAnimal = await this.findCompaniaEntity(this.tipoAnimalRepo, ctx, parsed.tipoAnimalId);
    if (tipoAnimal.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('MAESTRA_INACTIVA', 'El registro esta inactivo y no puede usarse.');
    }

    const exists = await this.razaRepo.findOne({
      where: { tipoAnimalId: parsed.tipoAnimalId, nombre: parsed.nombre },
    });
    if (exists) {
      throw new ConflictError('MAESTRA_NOMBRE_DUPLICADO', 'Ya existe un registro con ese nombre.');
    }

    const entity = this.razaRepo.create({
      ...parsed,
      companiaId: ctx.companiaId,
      estadoRegistro: EstadoRegistro.ACTIVO,
    });
    return this.razaRepo.save(entity);
  }

  async actualizarRaza(ctx: TenantContext, id: string, input: ActualizarRazaInput) {
    this.assertMaestras(ctx);
    const parsed = actualizarRazaSchema.parse(input);
    const entity = await this.findCompaniaEntity(this.razaRepo, ctx, id);

    if (parsed.nombre && parsed.nombre !== entity.nombre) {
      const exists = await this.razaRepo.findOne({
        where: { tipoAnimalId: entity.tipoAnimalId, nombre: parsed.nombre },
      });
      if (exists) {
        throw new ConflictError('MAESTRA_NOMBRE_DUPLICADO', 'Ya existe un registro con ese nombre.');
      }
    }

    Object.assign(entity, parsed);
    return this.razaRepo.save(entity);
  }

  listarFinalidades(ctx: TenantContext, query: ListQuery) {
    this.assertMaestras(ctx);
    const qb = this.finalidadRepo
      .createQueryBuilder('finalidad')
      .where('finalidad.companiaId = :companiaId', { companiaId: ctx.companiaId });
    return paginate(qb, query, 'finalidad');
  }

  async crearFinalidad(ctx: TenantContext, input: unknown) {
    this.assertMaestras(ctx);
    const parsed = maestraCompaniaBaseSchema.parse(input);
    await this.assertNombreUnico(this.finalidadRepo, ctx.companiaId, parsed.nombre);

    const entity = this.finalidadRepo.create({
      ...parsed,
      companiaId: ctx.companiaId,
      estadoRegistro: EstadoRegistro.ACTIVO,
    });
    return this.finalidadRepo.save(entity);
  }

  async actualizarFinalidad(
    ctx: TenantContext,
    id: string,
    input: ActualizarMaestraCompaniaInput,
  ) {
    this.assertMaestras(ctx);
    const parsed = actualizarMaestraCompaniaSchema.parse(input);
    const entity = await this.findCompaniaEntity(this.finalidadRepo, ctx, id);

    if (
      parsed.estadoRegistro === EstadoRegistro.INACTIVO &&
      entity.estadoRegistro === EstadoRegistro.ACTIVO
    ) {
      await assertFinalidadCanInactivate(entity.id, this.loteRepo);
    }

    if (parsed.nombre && parsed.nombre !== entity.nombre) {
      await this.assertNombreUnico(this.finalidadRepo, ctx.companiaId, parsed.nombre);
    }

    Object.assign(entity, parsed);
    return this.finalidadRepo.save(entity);
  }

  listarTiposUbicacion(ctx: TenantContext, query: ListQuery) {
    this.assertMaestras(ctx);
    const qb = this.tipoUbicacionRepo
      .createQueryBuilder('tipoUbicacion')
      .where('tipoUbicacion.companiaId = :companiaId', { companiaId: ctx.companiaId });
    return paginate(qb, query, 'tipoUbicacion');
  }

  async crearTipoUbicacion(ctx: TenantContext, input: unknown) {
    this.assertMaestras(ctx);
    const parsed = maestraCompaniaBaseSchema.parse(input);
    await this.assertNombreUnico(this.tipoUbicacionRepo, ctx.companiaId, parsed.nombre);

    const entity = this.tipoUbicacionRepo.create({
      ...parsed,
      companiaId: ctx.companiaId,
      estadoRegistro: EstadoRegistro.ACTIVO,
    });
    return this.tipoUbicacionRepo.save(entity);
  }

  async actualizarTipoUbicacion(
    ctx: TenantContext,
    id: string,
    input: ActualizarMaestraCompaniaInput,
  ) {
    this.assertMaestras(ctx);
    const parsed = actualizarMaestraCompaniaSchema.parse(input);
    const entity = await this.findCompaniaEntity(this.tipoUbicacionRepo, ctx, id);

    if (
      parsed.estadoRegistro === EstadoRegistro.INACTIVO &&
      entity.estadoRegistro === EstadoRegistro.ACTIVO
    ) {
      await assertTipoUbicacionCanInactivate(entity.id, this.ubicacionRepo);
    }

    if (parsed.nombre && parsed.nombre !== entity.nombre) {
      await this.assertNombreUnico(this.tipoUbicacionRepo, ctx.companiaId, parsed.nombre);
    }

    Object.assign(entity, parsed);
    return this.tipoUbicacionRepo.save(entity);
  }

  async listarUbicaciones(
    ctx: TenantContext,
    query: ListQuery,
    granjaId?: string,
  ): Promise<PaginatedResponse<Ubicacion>> {
    this.assertMaestras(ctx);
    const targetGranjaId = granjaId ?? ctx.granjaActivaId;
    if (!targetGranjaId) {
      return {
        items: [],
        meta: { page: query.page, limit: query.limit, total: 0, totalPages: 1 },
      };
    }
    requireGranjaAccess(ctx, targetGranjaId);

    const qb = this.ubicacionRepo
      .createQueryBuilder('ubicacion')
      .where('ubicacion.granjaId = :granjaId', { granjaId: targetGranjaId });

    return paginate(qb, query, 'ubicacion');
  }

  async crearUbicacion(ctx: TenantContext, input: CrearUbicacionInput) {
    this.assertMaestras(ctx);
    const parsed = crearUbicacionSchema.parse(input);
    await this.assertGranjaActiva(ctx, parsed.granjaId);

    const tipoUbicacion = await this.tipoUbicacionRepo.findOne({
      where: { id: parsed.tipoUbicacionId, companiaId: ctx.companiaId },
    });
    if (!tipoUbicacion) {
      throw new NotFoundError('El tipo de ubicacion indicado no existe.');
    }
    if (tipoUbicacion.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('MAESTRA_INACTIVA', 'El registro esta inactivo y no puede usarse.');
    }

    const exists = await this.ubicacionRepo.findOne({
      where: { granjaId: parsed.granjaId, nombre: parsed.nombre },
    });
    if (exists) {
      throw new ConflictError('UBICACION_NOMBRE_DUPLICADO', 'Ya existe una ubicacion con ese nombre en la granja.');
    }

    const entity = this.ubicacionRepo.create({
      ...parsed,
      estadoRegistro: EstadoRegistro.ACTIVO,
      createdById: ctx.userId,
      updatedById: ctx.userId,
    });
    return this.ubicacionRepo.save(entity);
  }

  async actualizarUbicacion(ctx: TenantContext, id: string, input: ActualizarUbicacionInput) {
    this.assertMaestras(ctx);
    const parsed = actualizarUbicacionSchema.parse(input);
    const entity = await this.ubicacionRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundError('La ubicacion solicitada no existe.');
    }

    await this.assertGranjaActiva(ctx, entity.granjaId);

    if (
      parsed.estadoRegistro === EstadoRegistro.INACTIVO &&
      entity.estadoRegistro === EstadoRegistro.ACTIVO
    ) {
      await assertUbicacionCanInactivate(entity.id, this.loteRepo);
    }

    if (parsed.nombre && parsed.nombre !== entity.nombre) {
      const exists = await this.ubicacionRepo.findOne({
        where: { granjaId: entity.granjaId, nombre: parsed.nombre },
      });
      if (exists) {
        throw new ConflictError('UBICACION_NOMBRE_DUPLICADO', 'Ya existe una ubicacion con ese nombre en la granja.');
      }
    }

    Object.assign(entity, parsed, { updatedById: ctx.userId });
    return this.ubicacionRepo.save(entity);
  }

  listarMotivosCierreEngorde(ctx: TenantContext, query: ListQuery) {
    this.assertMaestras(ctx);
    const qb = this.motivoCierreRepo
      .createQueryBuilder('motivo')
      .where('motivo.companiaId = :companiaId', { companiaId: ctx.companiaId });
    return paginate(qb, query, 'motivo');
  }

  async crearMotivoCierreEngorde(ctx: TenantContext, input: unknown) {
    this.assertMaestras(ctx);
    const parsed = maestraCompaniaBaseSchema.parse(input);
    await this.assertNombreUnico(this.motivoCierreRepo, ctx.companiaId, parsed.nombre);
    return this.motivoCierreRepo.save(
      this.motivoCierreRepo.create({
        ...parsed,
        companiaId: ctx.companiaId,
        estadoRegistro: EstadoRegistro.ACTIVO,
      }),
    );
  }

  async actualizarMotivoCierreEngorde(
    ctx: TenantContext,
    id: string,
    input: ActualizarMaestraCompaniaInput,
  ) {
    this.assertMaestras(ctx);
    const parsed = actualizarMaestraCompaniaSchema.parse(input);
    const entity = await this.findCompaniaEntity(this.motivoCierreRepo, ctx, id);
    if (parsed.nombre && parsed.nombre !== entity.nombre) {
      await this.assertNombreUnico(this.motivoCierreRepo, ctx.companiaId, parsed.nombre);
    }
    Object.assign(entity, parsed);
    return this.motivoCierreRepo.save(entity);
  }

  listarMotivosBajaEngorde(ctx: TenantContext, query: ListQuery) {
    this.assertMaestras(ctx);
    const qb = this.motivoBajaRepo
      .createQueryBuilder('motivo')
      .where('motivo.companiaId = :companiaId', { companiaId: ctx.companiaId });
    return paginate(qb, query, 'motivo');
  }

  async crearMotivoBajaEngorde(ctx: TenantContext, input: CrearMotivoBajaEngordeInput) {
    this.assertMaestras(ctx);
    const parsed = crearMotivoBajaEngordeSchema.parse(input);
    await this.assertNombreUnico(this.motivoBajaRepo, ctx.companiaId, parsed.nombre);
    return this.motivoBajaRepo.save(
      this.motivoBajaRepo.create({
        ...parsed,
        companiaId: ctx.companiaId,
        estadoRegistro: EstadoRegistro.ACTIVO,
      }),
    );
  }

  async actualizarMotivoBajaEngorde(
    ctx: TenantContext,
    id: string,
    input: ActualizarMotivoBajaEngordeInput,
  ) {
    this.assertMaestras(ctx);
    const parsed = actualizarMotivoBajaEngordeSchema.parse(input);
    const entity = await this.findCompaniaEntity(this.motivoBajaRepo, ctx, id);
    if (parsed.nombre && parsed.nombre !== entity.nombre) {
      await this.assertNombreUnico(this.motivoBajaRepo, ctx.companiaId, parsed.nombre);
    }
    Object.assign(entity, parsed);
    return this.motivoBajaRepo.save(entity);
  }

  listarMotivosMovimientoUbicacion(ctx: TenantContext, query: ListQuery) {
    this.assertMaestras(ctx);
    const qb = this.motivoMovUbicacionRepo
      .createQueryBuilder('motivo')
      .where('motivo.companiaId = :companiaId', { companiaId: ctx.companiaId });
    return paginate(qb, query, 'motivo');
  }

  async crearMotivoMovimientoUbicacion(ctx: TenantContext, input: unknown) {
    this.assertMaestras(ctx);
    const parsed = maestraCompaniaBaseSchema.parse(input);
    await this.assertNombreUnico(this.motivoMovUbicacionRepo, ctx.companiaId, parsed.nombre);
    return this.motivoMovUbicacionRepo.save(
      this.motivoMovUbicacionRepo.create({
        ...parsed,
        companiaId: ctx.companiaId,
        estadoRegistro: EstadoRegistro.ACTIVO,
      }),
    );
  }

  async actualizarMotivoMovimientoUbicacion(
    ctx: TenantContext,
    id: string,
    input: ActualizarMaestraCompaniaInput,
  ) {
    this.assertMaestras(ctx);
    const parsed = actualizarMaestraCompaniaSchema.parse(input);
    const entity = await this.findCompaniaEntity(this.motivoMovUbicacionRepo, ctx, id);
    if (parsed.nombre && parsed.nombre !== entity.nombre) {
      await this.assertNombreUnico(this.motivoMovUbicacionRepo, ctx.companiaId, parsed.nombre);
    }
    Object.assign(entity, parsed);
    return this.motivoMovUbicacionRepo.save(entity);
  }

  listarMetodosPesaje(ctx: TenantContext, query: ListQuery) {
    this.assertMaestras(ctx);
    const qb = this.metodoPesajeRepo
      .createQueryBuilder('metodo')
      .where('metodo.companiaId = :companiaId', { companiaId: ctx.companiaId });
    return paginate(qb, query, 'metodo');
  }

  async crearMetodoPesaje(ctx: TenantContext, input: unknown) {
    this.assertMaestras(ctx);
    const parsed = maestraCompaniaBaseSchema.parse(input);
    await this.assertNombreUnico(this.metodoPesajeRepo, ctx.companiaId, parsed.nombre);
    return this.metodoPesajeRepo.save(
      this.metodoPesajeRepo.create({
        ...parsed,
        companiaId: ctx.companiaId,
        estadoRegistro: EstadoRegistro.ACTIVO,
      }),
    );
  }

  async actualizarMetodoPesaje(
    ctx: TenantContext,
    id: string,
    input: ActualizarMaestraCompaniaInput,
  ) {
    this.assertMaestras(ctx);
    const parsed = actualizarMaestraCompaniaSchema.parse(input);
    const entity = await this.findCompaniaEntity(this.metodoPesajeRepo, ctx, id);
    if (parsed.nombre && parsed.nombre !== entity.nombre) {
      await this.assertNombreUnico(this.metodoPesajeRepo, ctx.companiaId, parsed.nombre);
    }
    Object.assign(entity, parsed);
    return this.metodoPesajeRepo.save(entity);
  }

  private assertMaestras(ctx: TenantContext) {
    requirePermission(ctx, PERMISOS.MAESTRAS_ADMINISTRAR);
  }

  private async assertNombreUnico<T extends { companiaId: string; nombre: string }>(
    repo: Repository<T>,
    companiaId: string,
    nombre: string,
  ) {
    const exists = await repo.findOne({ where: { companiaId, nombre } as never });
    if (exists) {
      throw new ConflictError('MAESTRA_NOMBRE_DUPLICADO', 'Ya existe un registro con ese nombre.');
    }
  }

  private async findCompaniaEntity<T extends { id: string; companiaId: string }>(
    repo: Repository<T>,
    ctx: TenantContext,
    id: string,
  ) {
    const entity = await repo.findOne({ where: { id, companiaId: ctx.companiaId } as never });
    if (!entity) {
      throw new NotFoundError('El registro solicitado no existe.');
    }
    return entity;
  }

  private async assertGranjaActiva(ctx: TenantContext, granjaId: string) {
    requireGranjaAccess(ctx, granjaId);
    const granja = await this.granjaRepo.findOne({ where: { id: granjaId } });
    if (!granja || granja.companiaId !== ctx.companiaId) {
      throw new BusinessRuleError(
        'UBICACION_GRANJA_INVALIDA',
        'La ubicacion no pertenece a la granja indicada.',
      );
    }
    if (granja.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('GRANJA_INACTIVA', 'La granja esta inactiva.');
    }
  }
}
