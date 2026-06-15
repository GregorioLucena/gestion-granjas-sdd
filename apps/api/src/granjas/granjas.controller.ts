import { Controller, Get, Patch, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { GranjasService } from './granjas.service';
import { TenantCtx } from '../common/tenant/tenant-context.decorator';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { parseListQuery } from '../common/pagination/paginate';
import type { TenantContext } from '@gestion-granjas/shared';

@Controller('granjas')
@UseGuards(TenantGuard)
export class GranjasController {
  constructor(private readonly granjasService: GranjasService) {}

  @Get()
  async listar(
    @TenantCtx() ctx: TenantContext,
    @Query() query: Record<string, unknown>,
    @Query('companiaId') companiaId?: string,
  ) {
    const data = await this.granjasService.listar(ctx, parseListQuery(query), companiaId);
    return { data };
  }

  @Post()
  async crear(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    const data = await this.granjasService.crear(ctx, body as never);
    return { data };
  }

  @Patch(':id')
  async actualizar(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = await this.granjasService.actualizar(ctx, id, body as never);
    return { data };
  }
}
