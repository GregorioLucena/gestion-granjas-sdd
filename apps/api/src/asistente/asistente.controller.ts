import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import type { TenantContext } from '@gestion-granjas/shared';
import { TenantCtx } from '../common/tenant/tenant-context.decorator';
import { AsistenteService } from './asistente.service';

@Controller('asistente/recomendaciones')
export class AsistenteController {
  constructor(private readonly asistenteService: AsistenteService) {}

  @Get()
  async listar(
    @TenantCtx() ctx: TenantContext,
    @Query('granjaId') granjaId?: string,
    @Query('estado') estado?: string,
    @Query('tipo') tipo?: string,
  ) {
    const data = await this.asistenteService.listar(ctx, {
      granjaId,
      estado: estado as never,
      tipo: tipo as never,
    });
    return { data };
  }

  @Get(':id')
  async obtener(@TenantCtx() ctx: TenantContext, @Param('id') id: string) {
    const data = await this.asistenteService.obtener(ctx, id);
    return { data };
  }

  @Patch(':id/decidir')
  async decidir(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = await this.asistenteService.decidir(ctx, id, body as never);
    return { data };
  }
}
