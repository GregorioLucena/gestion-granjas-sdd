import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import type { TenantContext } from '@gestion-granjas/shared';
import { TenantCtx } from '../common/tenant/tenant-context.decorator';
import { parseListQuery } from '../common/pagination/paginate';
import { LotesService } from './lotes.service';

@Controller('lotes')
export class LotesController {
  constructor(private readonly lotesService: LotesService) {}

  @Get()
  async listar(
    @TenantCtx() ctx: TenantContext,
    @Query() query: Record<string, unknown>,
    @Query('granjaId') granjaId?: string,
    @Query('estadoOperativo') estadoOperativo?: string,
  ) {
    const data = await this.lotesService.listar(
      ctx,
      parseListQuery(query),
      granjaId,
      estadoOperativo,
    );
    return { data };
  }

  @Post()
  async crear(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    const data = await this.lotesService.crear(ctx, body as never);
    return { data };
  }

  @Patch(':id')
  async actualizar(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = await this.lotesService.actualizar(ctx, id, body as never);
    return { data };
  }
}
