import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TenantCtx } from '../common/tenant/tenant-context.decorator';
import type { TenantContext } from '@gestion-granjas/shared';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  async listar(@TenantCtx() ctx: TenantContext, @Query() query: Record<string, unknown>) {
    const data = await this.usuariosService.listar(ctx, this.usuariosService.parseListQuery(query));
    return { data };
  }

  @Post()
  async crear(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    const data = await this.usuariosService.crear(ctx, body as never);
    return { data };
  }

  @Patch(':id')
  async actualizar(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = await this.usuariosService.actualizar(ctx, id, body as never);
    return { data };
  }

  @Post(':id/restablecer-contrasena')
  async restablecerContrasena(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = await this.usuariosService.restablecerContrasena(ctx, id, body as never);
    return { data };
  }
}
