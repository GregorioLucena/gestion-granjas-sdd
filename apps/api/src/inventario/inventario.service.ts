import {
  ConflictError,
  BusinessRuleError,
  NotFoundError,
} from '@gestion-granjas/shared/errors';
import {
  PERMISOS,
  requireGranjaAccess,
  requirePermission,
} from '@gestion-granjas/shared/permissions';
import type { TenantContext } from '@gestion-granjas/shared';
import type { ListQuery, PaginatedResponse } from '@gestion-granjas/shared/schemas/pagination.schemas';
import {
  actualizarAlimentoSchema,
  actualizarAlmacenSchema,
  actualizarPresentacionAlimentoSchema,
  actualizarProveedorSchema,
  actualizarTipoAlimentoSchema,
  anularMovimientoInventarioSchema,
  crearAlimentoSchema,
  crearAlmacenSchema,
  crearMovimientoInventarioSchema,
  crearPresentacionAlimentoSchema,
  crearProveedorSchema,
  crearTipoAlimentoSchema,
  type ActualizarAlimentoInput,
  type ActualizarAlmacenInput,
  type ActualizarPresentacionAlimentoInput,
  type ActualizarProveedorInput,
  type ActualizarTipoAlimentoInput,
  type AnularMovimientoInventarioInput,
  type CrearAlimentoInput,
  type CrearAlmacenInput,
  type CrearMovimientoInventarioInput,
  type CrearPresentacionAlimentoInput,
  type CrearProveedorInput,
  type CrearTipoAlimentoInput,
} from '@gestion-granjas/shared/schemas/inventario.schemas';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  Alimento,
  Almacen,
  Granja,
  MovimientoInventario,
  PresentacionAlimento,
  Proveedor,
  TipoAlimento,
  TipoMovimientoInventario,
  Ubicacion,
  UnidadMedida,
} from '@gestion-granjas/database/entities';
import { EstadoRegistro, SignoMovimiento } from '@gestion-granjas/database/enums';
import { DataSource, In, Repository } from 'typeorm';
import { paginate } from '../common/pagination/paginate';
import {
  assertCantidadValida,
  assertMotivoAjusteRequerido,
  assertStockSuficiente,
  computeCostoTotal,
  isTipoAjuste,
  isTipoEntrada,
  isTipoSalidaManual,
  requiresStockCheck,
} from './inventario.rules';

export type ExistenciaInventario = {
  granjaId: string;
  almacenId: string;
  alimentoId: string;
  cantidad: number;
  almacen?: Almacen;
  alimento?: Alimento;
};

@Injectable()
export class InventarioService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(TipoAlimento) private readonly tipoAlimentoRepo: Repository<TipoAlimento>,
    @InjectRepository(PresentacionAlimento)
    private readonly presentacionRepo: Repository<PresentacionAlimento>,
    @InjectRepository(UnidadMedida) private readonly unidadRepo: Repository<UnidadMedida>,
    @InjectRepository(Proveedor) private readonly proveedorRepo: Repository<Proveedor>,
    @InjectRepository(Almacen) private readonly almacenRepo: Repository<Almacen>,
    @InjectRepository(Alimento) private readonly alimentoRepo: Repository<Alimento>,
    @InjectRepository(MovimientoInventario)
    private readonly movimientoRepo: Repository<MovimientoInventario>,
    @InjectRepository(TipoMovimientoInventario)
    private readonly tipoMovimientoRepo: Repository<TipoMovimientoInventario>,
    @InjectRepository(Granja) private readonly granjaRepo: Repository<Granja>,
    @InjectRepository(Ubicacion) private readonly ubicacionRepo: Repository<Ubicacion>,
  ) {}

  listarTiposAlimento(ctx: TenantContext, query: ListQuery) {
    requirePermission(ctx, PERMISOS.INVENTARIO_VER);
    const qb = this.tipoAlimentoRepo
      .createQueryBuilder('tipoAlimento')
      .where('tipoAlimento.companiaId = :companiaId', { companiaId: ctx.companiaId });
    return paginate(qb, query, 'tipoAlimento');
  }

  async crearTipoAlimento(ctx: TenantContext, input: CrearTipoAlimentoInput) {
    requirePermission(ctx, PERMISOS.INVENTARIO_ALIMENTOS_CREAR);
    const parsed = crearTipoAlimentoSchema.parse(input);
    await this.assertNombreUnicoCompania(this.tipoAlimentoRepo, ctx.companiaId, parsed.nombre);
    return this.tipoAlimentoRepo.save(
      this.tipoAlimentoRepo.create({
        ...parsed,
        companiaId: ctx.companiaId,
        estadoRegistro: EstadoRegistro.ACTIVO,
      }),
    );
  }

  async actualizarTipoAlimento(ctx: TenantContext, id: string, input: ActualizarTipoAlimentoInput) {
    requirePermission(ctx, PERMISOS.INVENTARIO_ALIMENTOS_EDITAR);
    const parsed = actualizarTipoAlimentoSchema.parse(input);
    const entity = await this.findCompaniaEntity(this.tipoAlimentoRepo, ctx, id);
    if (parsed.nombre && parsed.nombre !== entity.nombre) {
      await this.assertNombreUnicoCompania(this.tipoAlimentoRepo, ctx.companiaId, parsed.nombre);
    }
    Object.assign(entity, parsed);
    return this.tipoAlimentoRepo.save(entity);
  }

  listarPresentaciones(ctx: TenantContext, query: ListQuery) {
    requirePermission(ctx, PERMISOS.INVENTARIO_VER);
    const qb = this.presentacionRepo
      .createQueryBuilder('presentacion')
      .where('presentacion.companiaId = :companiaId', { companiaId: ctx.companiaId });
    return paginate(qb, query, 'presentacion');
  }

  async crearPresentacion(ctx: TenantContext, input: CrearPresentacionAlimentoInput) {
    requirePermission(ctx, PERMISOS.INVENTARIO_ALIMENTOS_CREAR);
    const parsed = crearPresentacionAlimentoSchema.parse(input);
    await this.assertNombreUnicoCompania(this.presentacionRepo, ctx.companiaId, parsed.nombre);
    return this.presentacionRepo.save(
      this.presentacionRepo.create({
        ...parsed,
        companiaId: ctx.companiaId,
        estadoRegistro: EstadoRegistro.ACTIVO,
      }),
    );
  }

  async actualizarPresentacion(
    ctx: TenantContext,
    id: string,
    input: ActualizarPresentacionAlimentoInput,
  ) {
    requirePermission(ctx, PERMISOS.INVENTARIO_ALIMENTOS_EDITAR);
    const parsed = actualizarPresentacionAlimentoSchema.parse(input);
    const entity = await this.findCompaniaEntity(this.presentacionRepo, ctx, id);
    if (parsed.nombre && parsed.nombre !== entity.nombre) {
      await this.assertNombreUnicoCompania(this.presentacionRepo, ctx.companiaId, parsed.nombre);
    }
    Object.assign(entity, parsed);
    return this.presentacionRepo.save(entity);
  }

  async listarUnidadesMedida(ctx: TenantContext) {
    requirePermission(ctx, PERMISOS.INVENTARIO_VER);
    return this.unidadRepo.find({
      where: { estadoRegistro: EstadoRegistro.ACTIVO },
      order: { nombre: 'ASC' },
    });
  }

  listarProveedores(ctx: TenantContext, query: ListQuery) {
    requirePermission(ctx, PERMISOS.INVENTARIO_VER);
    const qb = this.proveedorRepo
      .createQueryBuilder('proveedor')
      .where('proveedor.companiaId = :companiaId', { companiaId: ctx.companiaId });
    return paginate(qb, query, 'proveedor');
  }

  async crearProveedor(ctx: TenantContext, input: CrearProveedorInput) {
    requirePermission(ctx, PERMISOS.INVENTARIO_PROVEEDORES_ADMINISTRAR);
    const parsed = crearProveedorSchema.parse(input);
    await this.assertNombreUnicoCompania(
      this.proveedorRepo,
      ctx.companiaId,
      parsed.nombre,
      'INVENTARIO_PROVEEDOR_DUPLICADO',
      'Ya existe un proveedor con ese nombre.',
    );
    return this.proveedorRepo.save(
      this.proveedorRepo.create({
        ...parsed,
        companiaId: ctx.companiaId,
        estadoRegistro: EstadoRegistro.ACTIVO,
        createdById: ctx.userId,
      }),
    );
  }

  async actualizarProveedor(ctx: TenantContext, id: string, input: ActualizarProveedorInput) {
    requirePermission(ctx, PERMISOS.INVENTARIO_PROVEEDORES_ADMINISTRAR);
    const parsed = actualizarProveedorSchema.parse(input);
    const entity = await this.findCompaniaEntity(this.proveedorRepo, ctx, id);
    if (parsed.nombre && parsed.nombre !== entity.nombre) {
      await this.assertNombreUnicoCompania(
        this.proveedorRepo,
        ctx.companiaId,
        parsed.nombre,
        'INVENTARIO_PROVEEDOR_DUPLICADO',
        'Ya existe un proveedor con ese nombre.',
      );
    }
    Object.assign(entity, parsed, { updatedById: ctx.userId });
    return this.proveedorRepo.save(entity);
  }

  async listarAlmacenes(ctx: TenantContext, query: ListQuery, granjaId?: string) {
    requirePermission(ctx, PERMISOS.INVENTARIO_VER);
    const targetGranjaId = granjaId ?? ctx.granjaActivaId;
    if (!targetGranjaId) {
      return {
        items: [],
        meta: { page: query.page, limit: query.limit, total: 0, totalPages: 1 },
      } satisfies PaginatedResponse<Almacen>;
    }

    await this.assertGranjaAccesible(ctx, targetGranjaId);
    const qb = this.almacenRepo
      .createQueryBuilder('almacen')
      .leftJoinAndSelect('almacen.ubicacion', 'ubicacion')
      .where('almacen.companiaId = :companiaId', { companiaId: ctx.companiaId })
      .andWhere('almacen.granjaId = :granjaId', { granjaId: targetGranjaId });
    return paginate(qb, query, 'almacen');
  }

  async crearAlmacen(ctx: TenantContext, input: CrearAlmacenInput) {
    requirePermission(ctx, PERMISOS.INVENTARIO_ALMACENES_ADMINISTRAR);
    const parsed = crearAlmacenSchema.parse(input);
    await this.assertGranjaAccesible(ctx, parsed.granjaId);

    const exists = await this.almacenRepo.findOne({
      where: { granjaId: parsed.granjaId, nombre: parsed.nombre },
    });
    if (exists) {
      throw new ConflictError(
        'INVENTARIO_ALMACEN_DUPLICADO',
        'Ya existe un almacen con ese nombre en la granja.',
      );
    }

    if (parsed.ubicacionId) {
      await this.assertUbicacionGranja(parsed.ubicacionId, parsed.granjaId);
    }

    return this.almacenRepo.save(
      this.almacenRepo.create({
        ...parsed,
        companiaId: ctx.companiaId,
        estadoRegistro: EstadoRegistro.ACTIVO,
        createdById: ctx.userId,
      }),
    );
  }

  async actualizarAlmacen(ctx: TenantContext, id: string, input: ActualizarAlmacenInput) {
    requirePermission(ctx, PERMISOS.INVENTARIO_ALMACENES_ADMINISTRAR);
    const parsed = actualizarAlmacenSchema.parse(input);
    const entity = await this.findCompaniaEntity(this.almacenRepo, ctx, id);
    await this.assertGranjaAccesible(ctx, entity.granjaId);

    if (parsed.nombre && parsed.nombre !== entity.nombre) {
      const exists = await this.almacenRepo.findOne({
        where: { granjaId: entity.granjaId, nombre: parsed.nombre },
      });
      if (exists) {
        throw new ConflictError(
          'INVENTARIO_ALMACEN_DUPLICADO',
          'Ya existe un almacen con ese nombre en la granja.',
        );
      }
    }

    if (parsed.ubicacionId) {
      await this.assertUbicacionGranja(parsed.ubicacionId, entity.granjaId);
    }

    Object.assign(entity, parsed, { updatedById: ctx.userId });
    return this.almacenRepo.save(entity);
  }

  listarAlimentos(ctx: TenantContext, query: ListQuery) {
    requirePermission(ctx, PERMISOS.INVENTARIO_VER);
    const qb = this.alimentoRepo
      .createQueryBuilder('alimento')
      .leftJoinAndSelect('alimento.tipoAlimento', 'tipoAlimento')
      .leftJoinAndSelect('alimento.presentacion', 'presentacion')
      .leftJoinAndSelect('alimento.unidadMedida', 'unidadMedida')
      .where('alimento.companiaId = :companiaId', { companiaId: ctx.companiaId });
    return paginate(qb, query, 'alimento');
  }

  async crearAlimento(ctx: TenantContext, input: CrearAlimentoInput) {
    requirePermission(ctx, PERMISOS.INVENTARIO_ALIMENTOS_CREAR);
    const parsed = crearAlimentoSchema.parse(input);
    await this.assertAlimentoMaestrasActivas(ctx, parsed);
    await this.assertNombreUnicoCompania(
      this.alimentoRepo,
      ctx.companiaId,
      parsed.nombre,
      'INVENTARIO_ALIMENTO_DUPLICADO',
      'Ya existe un alimento con ese nombre.',
    );

    return this.alimentoRepo.save(
      this.alimentoRepo.create({
        ...parsed,
        factorConversion: String(parsed.factorConversion),
        costoReferencia:
          parsed.costoReferencia !== undefined ? String(parsed.costoReferencia) : undefined,
        companiaId: ctx.companiaId,
        estadoRegistro: EstadoRegistro.ACTIVO,
        createdById: ctx.userId,
      }),
    );
  }

  async actualizarAlimento(ctx: TenantContext, id: string, input: ActualizarAlimentoInput) {
    requirePermission(ctx, PERMISOS.INVENTARIO_ALIMENTOS_EDITAR);
    const parsed = actualizarAlimentoSchema.parse(input);
    const entity = await this.findCompaniaEntity(this.alimentoRepo, ctx, id);

    if (parsed.tipoAlimentoId || parsed.presentacionId || parsed.unidadMedidaId) {
      await this.assertAlimentoMaestrasActivas(ctx, {
        tipoAlimentoId: parsed.tipoAlimentoId ?? entity.tipoAlimentoId,
        presentacionId: parsed.presentacionId ?? entity.presentacionId,
        unidadMedidaId: parsed.unidadMedidaId ?? entity.unidadMedidaId,
      });
    }

    if (parsed.nombre && parsed.nombre !== entity.nombre) {
      await this.assertNombreUnicoCompania(
        this.alimentoRepo,
        ctx.companiaId,
        parsed.nombre,
        'INVENTARIO_ALIMENTO_DUPLICADO',
        'Ya existe un alimento con ese nombre.',
      );
    }

    if (parsed.factorConversion !== undefined) {
      entity.factorConversion = String(parsed.factorConversion);
    }
    if (parsed.costoReferencia !== undefined) {
      entity.costoReferencia = String(parsed.costoReferencia);
    }

    const { factorConversion: _factor, costoReferencia: _costo, ...rest } = parsed;
    Object.assign(entity, rest, { updatedById: ctx.userId });
    return this.alimentoRepo.save(entity);
  }

  async listarTiposMovimiento(ctx: TenantContext) {
    requirePermission(ctx, PERMISOS.INVENTARIO_VER);
    return this.tipoMovimientoRepo.find({
      where: { estadoRegistro: EstadoRegistro.ACTIVO },
      order: { nombre: 'ASC' },
    });
  }

  async listarMovimientos(
    ctx: TenantContext,
    query: ListQuery,
    granjaId?: string,
    alimentoId?: string,
    almacenId?: string,
  ): Promise<PaginatedResponse<MovimientoInventario>> {
    requirePermission(ctx, PERMISOS.INVENTARIO_VER);
    const targetGranjaId = granjaId ?? ctx.granjaActivaId;
    if (!targetGranjaId) {
      return {
        items: [],
        meta: { page: query.page, limit: query.limit, total: 0, totalPages: 1 },
      };
    }

    await this.assertGranjaAccesible(ctx, targetGranjaId);
    const qb = this.movimientoRepo
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.almacen', 'almacen')
      .leftJoinAndSelect('movimiento.alimento', 'alimento')
      .leftJoinAndSelect('movimiento.tipoMovimiento', 'tipoMovimiento')
      .leftJoinAndSelect('movimiento.proveedor', 'proveedor')
      .leftJoinAndSelect('movimiento.unidadMedida', 'unidadMedida')
      .where('movimiento.companiaId = :companiaId', { companiaId: ctx.companiaId })
      .andWhere('movimiento.granjaId = :granjaId', { granjaId: targetGranjaId });

    if (alimentoId) {
      qb.andWhere('movimiento.alimentoId = :alimentoId', { alimentoId });
    }
    if (almacenId) {
      qb.andWhere('movimiento.almacenId = :almacenId', { almacenId });
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

  async crearMovimiento(ctx: TenantContext, input: CrearMovimientoInventarioInput) {
    const parsed = crearMovimientoInventarioSchema.parse(input);
    const tipoMovimiento = await this.tipoMovimientoRepo.findOne({
      where: { id: parsed.tipoMovimientoId },
    });
    if (!tipoMovimiento || tipoMovimiento.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new BusinessRuleError(
        'INVENTARIO_TIPO_MOVIMIENTO_INVALIDO',
        'El tipo de movimiento no es valido para esta operacion.',
      );
    }

    this.assertPermisoMovimiento(ctx, tipoMovimiento.codigo);
    assertCantidadValida(parsed.cantidad);
    assertMotivoAjusteRequerido(tipoMovimiento, parsed.motivoAjuste);

    if (tipoMovimiento.codigo === 'SALIDA_CONSUMO') {
      throw new BusinessRuleError(
        'INVENTARIO_TIPO_MOVIMIENTO_INVALIDO',
        'Este tipo de movimiento se registra desde consumo de alimento.',
      );
    }

    await this.assertGranjaAccesible(ctx, parsed.granjaId);
    const almacen = await this.findCompaniaEntity(this.almacenRepo, ctx, parsed.almacenId);
    if (almacen.granjaId !== parsed.granjaId) {
      throw new BusinessRuleError(
        'INVENTARIO_TIPO_MOVIMIENTO_INVALIDO',
        'El almacen no pertenece a la granja indicada.',
      );
    }
    if (almacen.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('INVENTARIO_ALMACEN_INACTIVO', 'El almacen esta inactivo.');
    }

    const alimento = await this.findCompaniaEntity(this.alimentoRepo, ctx, parsed.alimentoId);
    if (alimento.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('INVENTARIO_ALIMENTO_INACTIVO', 'El alimento esta inactivo.');
    }

    if (parsed.proveedorId) {
      const proveedor = await this.findCompaniaEntity(this.proveedorRepo, ctx, parsed.proveedorId);
      if (proveedor.estadoRegistro !== EstadoRegistro.ACTIVO) {
        throw new ConflictError('MAESTRA_INACTIVA', 'El registro esta inactivo y no puede usarse.');
      }
    }

    if (requiresStockCheck(tipoMovimiento)) {
      const existencia = await this.calcularExistencia(
        ctx.companiaId,
        parsed.granjaId,
        parsed.almacenId,
        parsed.alimentoId,
      );
      assertStockSuficiente(existencia, parsed.cantidad);
    }

    const costoTotal = computeCostoTotal(parsed.cantidad, parsed.costoUnitario);

    return this.dataSource.transaction(async (manager) => {
      const movimiento = manager.create(MovimientoInventario, {
        companiaId: ctx.companiaId,
        granjaId: parsed.granjaId,
        almacenId: parsed.almacenId,
        alimentoId: parsed.alimentoId,
        tipoMovimientoId: parsed.tipoMovimientoId,
        fecha: parsed.fecha,
        cantidad: String(parsed.cantidad),
        unidadMedidaId: alimento.unidadMedidaId,
        costoUnitario:
          parsed.costoUnitario !== undefined ? String(parsed.costoUnitario) : undefined,
        costoTotal,
        proveedorId: parsed.proveedorId,
        referencia: parsed.referencia,
        motivoAjuste: parsed.motivoAjuste,
        observaciones: parsed.observaciones,
        anulado: false,
        createdById: ctx.userId,
      });
      return manager.save(movimiento);
    });
  }

  async anularMovimiento(ctx: TenantContext, id: string, input: AnularMovimientoInventarioInput) {
    requirePermission(ctx, PERMISOS.INVENTARIO_MOVIMIENTOS_CREAR);
    const parsed = anularMovimientoInventarioSchema.parse(input);
    const movimiento = await this.movimientoRepo.findOne({
      where: { id, companiaId: ctx.companiaId },
      relations: { tipoMovimiento: true },
    });
    if (!movimiento) {
      throw new NotFoundError('El movimiento solicitado no existe.');
    }

    await this.assertGranjaAccesible(ctx, movimiento.granjaId);

    if (movimiento.anulado) {
      throw new ConflictError(
        'INVENTARIO_MOVIMIENTO_YA_ANULADO',
        'El movimiento ya fue anulado.',
      );
    }

    if (movimiento.tipoMovimiento.signo === SignoMovimiento.ENTRADA) {
      const existencia = await this.calcularExistencia(
        ctx.companiaId,
        movimiento.granjaId,
        movimiento.almacenId,
        movimiento.alimentoId,
      );
      const cantidad = Number(movimiento.cantidad);
      assertStockSuficiente(existencia, cantidad);
    }

    movimiento.anulado = true;
    movimiento.anuladoAt = new Date();
    movimiento.anuladoById = ctx.userId;
    movimiento.motivoAnulacion = parsed.motivoAnulacion;
    return this.movimientoRepo.save(movimiento);
  }

  async listarExistencias(
    ctx: TenantContext,
    granjaId?: string,
    almacenId?: string,
    alimentoId?: string,
  ): Promise<ExistenciaInventario[]> {
    requirePermission(ctx, PERMISOS.INVENTARIO_VER);
    const targetGranjaId = granjaId ?? ctx.granjaActivaId;
    if (!targetGranjaId) {
      return [];
    }

    await this.assertGranjaAccesible(ctx, targetGranjaId);

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
      .andWhere('movimiento.granjaId = :granjaId', { granjaId: targetGranjaId })
      .andWhere('movimiento.anulado = false')
      .setParameter('entrada', SignoMovimiento.ENTRADA)
      .groupBy('movimiento.granjaId')
      .addGroupBy('movimiento.almacenId')
      .addGroupBy('movimiento.alimentoId')
      .having(
        `COALESCE(SUM(
          CASE WHEN tipoMovimiento.signo = :entrada THEN movimiento.cantidad::numeric
          ELSE -movimiento.cantidad::numeric END
        ), 0) > 0`,
      );

    if (almacenId) {
      qb.andWhere('movimiento.almacenId = :almacenId', { almacenId });
    }
    if (alimentoId) {
      qb.andWhere('movimiento.alimentoId = :alimentoId', { alimentoId });
    }

    const rows = await qb.getRawMany<{ granjaId: string; almacenId: string; alimentoId: string; cantidad: string }>();
    if (rows.length === 0) {
      return [];
    }

    const almacenIds = [...new Set(rows.map((row) => row.almacenId))];
    const alimentoIds = [...new Set(rows.map((row) => row.alimentoId))];

    const [almacenes, alimentos] = await Promise.all([
      this.almacenRepo.find({ where: { id: In(almacenIds) } }),
      this.alimentoRepo.find({
        where: { id: In(alimentoIds) },
        relations: { tipoAlimento: true, presentacion: true, unidadMedida: true },
      }),
    ]);

    const almacenMap = new Map(almacenes.map((item) => [item.id, item]));
    const alimentoMap = new Map(alimentos.map((item) => [item.id, item]));

    return rows.map((row) => ({
      granjaId: row.granjaId,
      almacenId: row.almacenId,
      alimentoId: row.alimentoId,
      cantidad: Number(row.cantidad),
      almacen: almacenMap.get(row.almacenId),
      alimento: alimentoMap.get(row.alimentoId),
    }));
  }

  private assertPermisoMovimiento(ctx: TenantContext, codigo: string) {
    if (isTipoAjuste(codigo)) {
      requirePermission(ctx, PERMISOS.INVENTARIO_AJUSTES_CREAR);
      return;
    }
    if (isTipoEntrada(codigo) || isTipoSalidaManual(codigo)) {
      requirePermission(ctx, PERMISOS.INVENTARIO_MOVIMIENTOS_CREAR);
      return;
    }
    throw new BusinessRuleError(
      'INVENTARIO_TIPO_MOVIMIENTO_INVALIDO',
      'El tipo de movimiento no es valido para esta operacion.',
    );
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

  private async assertAlimentoMaestrasActivas(
    ctx: TenantContext,
    refs: { tipoAlimentoId: string; presentacionId: string; unidadMedidaId: string },
  ) {
    const [tipoAlimento, presentacion, unidad] = await Promise.all([
      this.tipoAlimentoRepo.findOne({
        where: { id: refs.tipoAlimentoId, companiaId: ctx.companiaId },
      }),
      this.presentacionRepo.findOne({
        where: { id: refs.presentacionId, companiaId: ctx.companiaId },
      }),
      this.unidadRepo.findOne({ where: { id: refs.unidadMedidaId } }),
    ]);

    if (!tipoAlimento || !presentacion || !unidad) {
      throw new NotFoundError('El registro solicitado no existe.');
    }
    if (
      tipoAlimento.estadoRegistro !== EstadoRegistro.ACTIVO ||
      presentacion.estadoRegistro !== EstadoRegistro.ACTIVO ||
      unidad.estadoRegistro !== EstadoRegistro.ACTIVO
    ) {
      throw new ConflictError('MAESTRA_INACTIVA', 'El registro esta inactivo y no puede usarse.');
    }
  }

  private async assertUbicacionGranja(ubicacionId: string, granjaId: string) {
    const ubicacion = await this.ubicacionRepo.findOne({ where: { id: ubicacionId } });
    if (!ubicacion || ubicacion.granjaId !== granjaId) {
      throw new BusinessRuleError(
        'UBICACION_GRANJA_INVALIDA',
        'La ubicacion no pertenece a la granja indicada.',
      );
    }
    if (ubicacion.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('MAESTRA_INACTIVA', 'El registro esta inactivo y no puede usarse.');
    }
  }

  private async assertGranjaAccesible(ctx: TenantContext, granjaId: string) {
    requireGranjaAccess(ctx, granjaId);
    const granja = await this.granjaRepo.findOne({ where: { id: granjaId } });
    if (!granja || granja.companiaId !== ctx.companiaId) {
      throw new BusinessRuleError('GRANJA_ACCESS_DENIED', 'No tiene acceso a esta granja.');
    }
    if (granja.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new ConflictError('GRANJA_INACTIVA', 'La granja esta inactiva.');
    }
  }

  private async assertNombreUnicoCompania<T extends { companiaId: string; nombre: string }>(
    repo: Repository<T>,
    companiaId: string,
    nombre: string,
    errorCode: 'INVENTARIO_ALIMENTO_DUPLICADO' | 'INVENTARIO_PROVEEDOR_DUPLICADO' | 'MAESTRA_NOMBRE_DUPLICADO' = 'MAESTRA_NOMBRE_DUPLICADO',
    errorMessage = 'Ya existe un registro con ese nombre.',
  ) {
    const exists = await repo.findOne({ where: { companiaId, nombre } as never });
    if (exists) {
      throw new ConflictError(errorCode, errorMessage);
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
}
