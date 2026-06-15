import { Controller, Get } from '@nestjs/common';
import { TenantCtx } from '../common/tenant/tenant-context.decorator';
import type { TenantContext } from '@gestion-granjas/shared';
import { PermisosService } from './permisos.service';

@Controller('permisos')
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @Get()
  async listar(@TenantCtx() ctx: TenantContext) {
    const data = await this.permisosService.listar(ctx);
    return { data };
  }
}
