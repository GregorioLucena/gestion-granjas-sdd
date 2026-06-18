import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import type { TenantContext } from '@gestion-granjas/shared';
import { TenantCtx } from '../common/tenant/tenant-context.decorator';
import { parseListQuery } from '../common/pagination/paginate';
import { InventarioService } from './inventario.service';

@Controller()
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get('tipos-alimento')
  listarTiposAlimento(@TenantCtx() ctx: TenantContext, @Query() query: Record<string, unknown>) {
    return this.inventarioService
      .listarTiposAlimento(ctx, parseListQuery(query))
      .then((data) => ({ data }));
  }

  @Post('tipos-alimento')
  crearTipoAlimento(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    return this.inventarioService.crearTipoAlimento(ctx, body as never).then((data) => ({ data }));
  }

  @Patch('tipos-alimento/:id')
  actualizarTipoAlimento(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.inventarioService
      .actualizarTipoAlimento(ctx, id, body as never)
      .then((data) => ({ data }));
  }

  @Get('presentaciones-alimento')
  listarPresentaciones(@TenantCtx() ctx: TenantContext, @Query() query: Record<string, unknown>) {
    return this.inventarioService
      .listarPresentaciones(ctx, parseListQuery(query))
      .then((data) => ({ data }));
  }

  @Post('presentaciones-alimento')
  crearPresentacion(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    return this.inventarioService.crearPresentacion(ctx, body as never).then((data) => ({ data }));
  }

  @Patch('presentaciones-alimento/:id')
  actualizarPresentacion(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.inventarioService
      .actualizarPresentacion(ctx, id, body as never)
      .then((data) => ({ data }));
  }

  @Get('unidades-medida')
  listarUnidadesMedida(@TenantCtx() ctx: TenantContext) {
    return this.inventarioService.listarUnidadesMedida(ctx).then((data) => ({ data }));
  }

  @Get('proveedores')
  listarProveedores(@TenantCtx() ctx: TenantContext, @Query() query: Record<string, unknown>) {
    return this.inventarioService
      .listarProveedores(ctx, parseListQuery(query))
      .then((data) => ({ data }));
  }

  @Post('proveedores')
  crearProveedor(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    return this.inventarioService.crearProveedor(ctx, body as never).then((data) => ({ data }));
  }

  @Patch('proveedores/:id')
  actualizarProveedor(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.inventarioService
      .actualizarProveedor(ctx, id, body as never)
      .then((data) => ({ data }));
  }

  @Get('almacenes')
  listarAlmacenes(
    @TenantCtx() ctx: TenantContext,
    @Query() query: Record<string, unknown>,
    @Query('granjaId') granjaId?: string,
  ) {
    return this.inventarioService
      .listarAlmacenes(ctx, parseListQuery(query), granjaId)
      .then((data) => ({ data }));
  }

  @Post('almacenes')
  crearAlmacen(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    return this.inventarioService.crearAlmacen(ctx, body as never).then((data) => ({ data }));
  }

  @Patch('almacenes/:id')
  actualizarAlmacen(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.inventarioService
      .actualizarAlmacen(ctx, id, body as never)
      .then((data) => ({ data }));
  }

  @Get('alimentos')
  listarAlimentos(@TenantCtx() ctx: TenantContext, @Query() query: Record<string, unknown>) {
    return this.inventarioService
      .listarAlimentos(ctx, parseListQuery(query))
      .then((data) => ({ data }));
  }

  @Post('alimentos')
  crearAlimento(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    return this.inventarioService.crearAlimento(ctx, body as never).then((data) => ({ data }));
  }

  @Patch('alimentos/:id')
  actualizarAlimento(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.inventarioService
      .actualizarAlimento(ctx, id, body as never)
      .then((data) => ({ data }));
  }

  @Get('tipos-movimiento-inventario')
  listarTiposMovimiento(@TenantCtx() ctx: TenantContext) {
    return this.inventarioService.listarTiposMovimiento(ctx).then((data) => ({ data }));
  }

  @Get('movimientos-inventario')
  listarMovimientos(
    @TenantCtx() ctx: TenantContext,
    @Query() query: Record<string, unknown>,
    @Query('granjaId') granjaId?: string,
    @Query('alimentoId') alimentoId?: string,
    @Query('almacenId') almacenId?: string,
  ) {
    return this.inventarioService
      .listarMovimientos(ctx, parseListQuery(query), granjaId, alimentoId, almacenId)
      .then((data) => ({ data }));
  }

  @Post('movimientos-inventario')
  crearMovimiento(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    return this.inventarioService.crearMovimiento(ctx, body as never).then((data) => ({ data }));
  }

  @Patch('movimientos-inventario/:id/anular')
  anularMovimiento(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.inventarioService
      .anularMovimiento(ctx, id, body as never)
      .then((data) => ({ data }));
  }

  @Get('existencias-inventario')
  listarExistencias(
    @TenantCtx() ctx: TenantContext,
    @Query('granjaId') granjaId?: string,
    @Query('almacenId') almacenId?: string,
    @Query('alimentoId') alimentoId?: string,
  ) {
    return this.inventarioService
      .listarExistencias(ctx, granjaId, almacenId, alimentoId)
      .then((data) => ({ data }));
  }
}
