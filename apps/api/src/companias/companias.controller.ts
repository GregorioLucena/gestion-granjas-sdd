import { Controller, Get, Patch, Post, Body, Param, Query } from '@nestjs/common';
import { CompaniasService } from './companias.service';
import { TenantCtx } from '../common/tenant/tenant-context.decorator';
import { parseListQuery } from '../common/pagination/paginate';
import type { TenantContext } from '@gestion-granjas/shared';

@Controller('companias')
export class CompaniasController {
  constructor(private readonly companiasService: CompaniasService) {}

  @Get()
  async listar(@TenantCtx() ctx: TenantContext, @Query() query: Record<string, unknown>) {
    const data = await this.companiasService.listar(ctx, parseListQuery(query));
    return { data };
  }

  @Post()
  async crear(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    const data = await this.companiasService.crear(ctx, body as never);
    return { data };
  }

  @Patch(':id')
  async actualizar(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = await this.companiasService.actualizar(ctx, id, body as never);
    return { data };
  }
}
