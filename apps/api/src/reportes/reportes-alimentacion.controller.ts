import { Controller, Get, Query } from '@nestjs/common';
import type { TenantContext } from '@gestion-granjas/shared';
import { TenantCtx } from '../common/tenant/tenant-context.decorator';
import { ReportesAlimentacionService } from './reportes-alimentacion.service';

@Controller('reportes/alimentacion')
export class ReportesAlimentacionController {
  constructor(private readonly reportesService: ReportesAlimentacionService) {}

  @Get('consumo-lotes')
  async consumoLotes(
    @TenantCtx() ctx: TenantContext,
    @Query() query: Record<string, unknown>,
  ) {
    return this.reportesService.consumoPorLotes(ctx, query);
  }

  @Get('consumo-alimentos')
  async consumoAlimentos(
    @TenantCtx() ctx: TenantContext,
    @Query() query: Record<string, unknown>,
  ) {
    return this.reportesService.consumoPorAlimentos(ctx, query);
  }

  @Get('existencias')
  async existencias(
    @TenantCtx() ctx: TenantContext,
    @Query() query: Record<string, unknown>,
  ) {
    return this.reportesService.existencias(ctx, query);
  }

  @Get('movimientos')
  async movimientos(
    @TenantCtx() ctx: TenantContext,
    @Query() query: Record<string, unknown>,
  ) {
    return this.reportesService.movimientos(ctx, query);
  }

  @Get('resumen')
  async resumen(
    @TenantCtx() ctx: TenantContext,
    @Query() query: Record<string, unknown>,
  ) {
    return this.reportesService.resumenMovimientos(ctx, query);
  }
}
