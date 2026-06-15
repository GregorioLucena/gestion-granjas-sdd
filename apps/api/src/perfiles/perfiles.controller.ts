import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TenantCtx } from '../common/tenant/tenant-context.decorator';
import type { TenantContext } from '@gestion-granjas/shared';
import { PerfilesService } from './perfiles.service';

@Controller('perfiles')
export class PerfilesController {
  constructor(private readonly perfilesService: PerfilesService) {}

  @Get()
  async listar(@TenantCtx() ctx: TenantContext, @Query() query: Record<string, unknown>) {
    const data = await this.perfilesService.listar(ctx, this.perfilesService.parseListQuery(query));
    return { data };
  }

  @Post()
  async crear(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    const data = await this.perfilesService.crear(ctx, body as never);
    return { data };
  }

  @Patch(':id')
  async actualizar(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = await this.perfilesService.actualizar(ctx, id, body as never);
    return { data };
  }
}
