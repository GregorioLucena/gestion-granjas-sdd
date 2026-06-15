import { Global, Module } from '@nestjs/common';
import { TenantContextService } from './tenant/tenant-context.decorator';

@Global()
@Module({
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class CommonModule {}
