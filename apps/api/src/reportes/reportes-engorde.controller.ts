import { Controller, Get, Param, Query } from '@nestjs/common';
import type { TenantContext } from '@gestion-granjas/shared';
import { TenantCtx } from '../common/tenant/tenant-context.decorator';
import { ReportesEngordeService } from './reportes-engorde.service';

@Controller('reportes/engorde')
export class ReportesEngordeController {
  constructor(private readonly reportesService: ReportesEngordeService) {}

  @Get('en-curso')
  async enCurso(@TenantCtx() ctx: TenantContext, @Query() query: Record<string, unknown>) {
    return this.reportesService.enCurso(ctx, query);
  }

  @Get('cerrados')
  async cerrados(@TenantCtx() ctx: TenantContext, @Query() query: Record<string, unknown>) {
    return this.reportesService.cerrados(ctx, query);
  }

  @Get('bajas')
  async bajas(@TenantCtx() ctx: TenantContext, @Query() query: Record<string, unknown>) {
    return this.reportesService.bajas(ctx, query);
  }

  @Get('lotes/:loteId')
  async resumenLote(
    @TenantCtx() ctx: TenantContext,
    @Param('loteId') loteId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.reportesService.resumenLote(ctx, loteId, query);
  }
}
