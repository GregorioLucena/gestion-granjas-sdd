import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import type { TenantContext } from '@gestion-granjas/shared';
import { TenantCtx } from '../common/tenant/tenant-context.decorator';
import { parseListQuery } from '../common/pagination/paginate';
import { PesosService } from './pesos.service';

@Controller('controles-peso')
export class PesosController {
  constructor(private readonly pesosService: PesosService) {}

  @Get()
  async listar(
    @TenantCtx() ctx: TenantContext,
    @Query() query: Record<string, unknown>,
    @Query('granjaId') granjaId?: string,
    @Query('engordeId') engordeId?: string,
    @Query('loteId') loteId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('incluirAnulados') incluirAnulados?: string,
  ) {
    const data = await this.pesosService.listar(
      ctx,
      parseListQuery(query),
      granjaId,
      engordeId,
      loteId,
      fechaDesde,
      fechaHasta,
      incluirAnulados,
    );
    return { data };
  }

  @Get(':id')
  async obtener(@TenantCtx() ctx: TenantContext, @Param('id') id: string) {
    const data = await this.pesosService.obtener(ctx, id);
    return { data };
  }

  @Post()
  async crear(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    const data = await this.pesosService.crear(ctx, body as never);
    return { data };
  }

  @Post(':id/anular')
  async anular(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = await this.pesosService.anular(ctx, id, body as never);
    return { data };
  }
}
