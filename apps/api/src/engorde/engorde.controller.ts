import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import type { TenantContext } from '@gestion-granjas/shared';
import { TenantCtx } from '../common/tenant/tenant-context.decorator';
import { parseListQuery } from '../common/pagination/paginate';
import { EngordeService } from './engorde.service';

@Controller('engordes')
export class EngordeController {
  constructor(private readonly engordeService: EngordeService) {}

  @Get()
  async listar(
    @TenantCtx() ctx: TenantContext,
    @Query() query: Record<string, unknown>,
    @Query('granjaId') granjaId?: string,
    @Query('loteId') loteId?: string,
    @Query('estado') estado?: string,
    @Query('incluirAnulados') incluirAnulados?: string,
  ) {
    const data = await this.engordeService.listar(
      ctx,
      parseListQuery(query),
      granjaId,
      loteId,
      estado,
      incluirAnulados,
    );
    return { data };
  }

  @Get(':id')
  async obtener(@TenantCtx() ctx: TenantContext, @Param('id') id: string) {
    const data = await this.engordeService.obtenerResumen(ctx, id);
    return { data };
  }

  @Post()
  async iniciar(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    const data = await this.engordeService.iniciar(ctx, body as never);
    return { data };
  }

  @Post(':id/bajas')
  async registrarBaja(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = await this.engordeService.registrarBaja(ctx, id, body as never);
    return { data };
  }

  @Post(':id/bajas/:bajaId/anular')
  async anularBaja(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Param('bajaId') bajaId: string,
    @Body() body: unknown,
  ) {
    const data = await this.engordeService.anularBaja(ctx, id, bajaId, body as never);
    return { data };
  }

  @Post(':id/cerrar')
  async cerrar(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = await this.engordeService.cerrar(ctx, id, body as never);
    return { data };
  }

  @Post(':id/cierres/:cierreId/anular')
  async anularCierre(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Param('cierreId') cierreId: string,
    @Body() body: unknown,
  ) {
    const data = await this.engordeService.anularCierre(ctx, id, cierreId, body as never);
    return { data };
  }

  @Post(':id/anular')
  async anularProceso(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = await this.engordeService.anularProceso(ctx, id, body as never);
    return { data };
  }
}
