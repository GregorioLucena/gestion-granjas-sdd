import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import type { TenantContext } from '@gestion-granjas/shared';
import { TenantCtx } from '../common/tenant/tenant-context.decorator';
import { parseListQuery } from '../common/pagination/paginate';
import { MovimientosUbicacionService } from './movimientos-ubicacion.service';

@Controller('movimientos-ubicacion')
export class MovimientosUbicacionController {
  constructor(private readonly movimientosService: MovimientosUbicacionService) {}

  @Get()
  async listar(
    @TenantCtx() ctx: TenantContext,
    @Query() query: Record<string, unknown>,
    @Query('granjaId') granjaId?: string,
    @Query('loteId') loteId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('incluirAnulados') incluirAnulados?: string,
  ) {
    const data = await this.movimientosService.listar(
      ctx,
      parseListQuery(query),
      granjaId,
      loteId,
      fechaDesde,
      fechaHasta,
      incluirAnulados,
    );
    return { data };
  }

  @Post()
  async crear(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    const data = await this.movimientosService.crear(ctx, body as never);
    return { data };
  }

  @Post(':id/anular')
  async anular(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = await this.movimientosService.anular(ctx, id, body as never);
    return { data };
  }
}
