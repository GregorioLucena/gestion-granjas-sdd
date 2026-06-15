import { Controller, Get, Patch, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MaestrasService } from './maestras.service';
import { TenantCtx } from '../common/tenant/tenant-context.decorator';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { parseListQuery } from '../common/pagination/paginate';
import type { TenantContext } from '@gestion-granjas/shared';

@Controller()
@UseGuards(TenantGuard)
export class MaestrasController {
  constructor(private readonly maestrasService: MaestrasService) {}

  @Get('tipos-animal')
  listarTiposAnimal(@TenantCtx() ctx: TenantContext, @Query() query: Record<string, unknown>) {
    return this.maestrasService
      .listarTiposAnimal(ctx, parseListQuery(query))
      .then((data) => ({ data }));
  }

  @Post('tipos-animal')
  crearTipoAnimal(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    return this.maestrasService.crearTipoAnimal(ctx, body as never).then((data) => ({ data }));
  }

  @Patch('tipos-animal/:id')
  actualizarTipoAnimal(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.maestrasService
      .actualizarTipoAnimal(ctx, id, body as never)
      .then((data) => ({ data }));
  }

  @Get('razas')
  listarRazas(
    @TenantCtx() ctx: TenantContext,
    @Query() query: Record<string, unknown>,
    @Query('tipoAnimalId') tipoAnimalId?: string,
  ) {
    return this.maestrasService
      .listarRazas(ctx, parseListQuery(query), tipoAnimalId)
      .then((data) => ({ data }));
  }

  @Post('razas')
  crearRaza(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    return this.maestrasService.crearRaza(ctx, body as never).then((data) => ({ data }));
  }

  @Patch('razas/:id')
  actualizarRaza(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.maestrasService.actualizarRaza(ctx, id, body as never).then((data) => ({ data }));
  }

  @Get('finalidades-productivas')
  listarFinalidades(@TenantCtx() ctx: TenantContext, @Query() query: Record<string, unknown>) {
    return this.maestrasService
      .listarFinalidades(ctx, parseListQuery(query))
      .then((data) => ({ data }));
  }

  @Post('finalidades-productivas')
  crearFinalidad(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    return this.maestrasService.crearFinalidad(ctx, body as never).then((data) => ({ data }));
  }

  @Patch('finalidades-productivas/:id')
  actualizarFinalidad(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.maestrasService
      .actualizarFinalidad(ctx, id, body as never)
      .then((data) => ({ data }));
  }

  @Get('tipos-ubicacion')
  listarTiposUbicacion(@TenantCtx() ctx: TenantContext, @Query() query: Record<string, unknown>) {
    return this.maestrasService
      .listarTiposUbicacion(ctx, parseListQuery(query))
      .then((data) => ({ data }));
  }

  @Post('tipos-ubicacion')
  crearTipoUbicacion(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    return this.maestrasService.crearTipoUbicacion(ctx, body as never).then((data) => ({ data }));
  }

  @Patch('tipos-ubicacion/:id')
  actualizarTipoUbicacion(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.maestrasService
      .actualizarTipoUbicacion(ctx, id, body as never)
      .then((data) => ({ data }));
  }

  @Get('ubicaciones')
  listarUbicaciones(
    @TenantCtx() ctx: TenantContext,
    @Query() query: Record<string, unknown>,
    @Query('granjaId') granjaId?: string,
  ) {
    return this.maestrasService
      .listarUbicaciones(ctx, parseListQuery(query), granjaId)
      .then((data) => ({ data }));
  }

  @Post('ubicaciones')
  crearUbicacion(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    return this.maestrasService.crearUbicacion(ctx, body as never).then((data) => ({ data }));
  }

  @Patch('ubicaciones/:id')
  actualizarUbicacion(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.maestrasService
      .actualizarUbicacion(ctx, id, body as never)
      .then((data) => ({ data }));
  }
}
