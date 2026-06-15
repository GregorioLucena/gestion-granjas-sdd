import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '@gestion-granjas/database/entities';
import { TenantContextService } from './tenant/tenant-context.decorator';
import { TenantGuard } from './tenant/tenant.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  providers: [TenantGuard, TenantContextService],
  exports: [TypeOrmModule, TenantGuard, TenantContextService],
})
export class CommonModule {}
